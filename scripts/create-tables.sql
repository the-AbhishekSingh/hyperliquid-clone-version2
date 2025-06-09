-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS market_data CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_balance(UUID, VARCHAR, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS calculate_pnl(DECIMAL, DECIMAL, DECIMAL, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_position_pnl() CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create balances table
CREATE TABLE balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(20) NOT NULL,
  total_balance DECIMAL(20, 8) DEFAULT 0,
  available_balance DECIMAL(20, 8) DEFAULT 0,
  locked_balance DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset)
);

-- Create positions table
CREATE TABLE positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
  size DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  mark_price DECIMAL(20, 8) NOT NULL,
  pnl DECIMAL(20, 8) DEFAULT 0,
  pnl_percent DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  type VARCHAR(10) NOT NULL CHECK (type IN ('market', 'limit')),
  size DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  filled_size DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'partially_filled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  size DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create market_data table for caching
CREATE TABLE market_data (
  symbol VARCHAR(20) PRIMARY KEY,
  price DECIMAL(20, 8) NOT NULL,
  change_24h DECIMAL(20, 8) DEFAULT 0,
  change_percent_24h DECIMAL(10, 4) DEFAULT 0,
  volume_24h DECIMAL(20, 2) DEFAULT 0,
  high_24h DECIMAL(20, 8) DEFAULT 0,
  low_24h DECIMAL(20, 8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_balances_user_id ON balances(user_id);
CREATE INDEX idx_positions_user_id ON positions(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_created_at ON trades(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_data_updated_at BEFORE UPDATE ON market_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create helper functions
CREATE OR REPLACE FUNCTION update_balance(
  p_user_id UUID,
  p_asset VARCHAR(20),
  p_amount DECIMAL(20, 8)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO balances (user_id, asset, total_balance, available_balance)
  VALUES (p_user_id, p_asset, p_amount, p_amount)
  ON CONFLICT (user_id, asset)
  DO UPDATE SET
    total_balance = balances.total_balance + p_amount,
    available_balance = balances.available_balance + p_amount,
    updated_at = NOW()
  WHERE balances.available_balance + p_amount >= 0;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate PnL
CREATE OR REPLACE FUNCTION calculate_pnl(
  p_entry_price DECIMAL(20, 8),
  p_mark_price DECIMAL(20, 8),
  p_size DECIMAL(20, 8),
  p_side VARCHAR(10)
)
RETURNS DECIMAL(20, 8) AS $$
BEGIN
  IF p_side = 'long' THEN
    RETURN (p_mark_price - p_entry_price) * p_size;
  ELSE
    RETURN (p_entry_price - p_mark_price) * p_size;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update position PnL
CREATE OR REPLACE FUNCTION update_position_pnl()
RETURNS TRIGGER AS $$
BEGIN
  NEW.pnl = calculate_pnl(NEW.entry_price, NEW.mark_price, NEW.size, NEW.side);
  NEW.pnl_percent = (NEW.pnl / (NEW.entry_price * NEW.size)) * 100;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for position PnL updates
CREATE TRIGGER update_position_pnl_trigger
  BEFORE INSERT OR UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION update_position_pnl();

-- Grant permissions (for public access in demo)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for authenticated users)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own balances" ON balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own balances" ON balances FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own positions" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON positions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Market data is public
CREATE POLICY "Anyone can view market data" ON market_data FOR SELECT TO public USING (true);
