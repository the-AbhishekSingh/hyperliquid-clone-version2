-- Complete setup script for demo environment
-- Run this script to set up all tables and demo data

-- First, ensure we have the demo user
INSERT INTO users (id, email, username) 
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@hyperliquid.com', 'demo_user')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  updated_at = NOW();

-- Insert initial balances for demo user
INSERT INTO balances (user_id, asset, total_balance, available_balance, locked_balance) VALUES
('00000000-0000-0000-0000-000000000001', 'USDT', 10000.00000000, 8500.00000000, 1500.00000000),
('00000000-0000-0000-0000-000000000001', 'BTC', 0.25000000, 0.20000000, 0.05000000),
('00000000-0000-0000-0000-000000000001', 'ETH', 5.00000000, 4.50000000, 0.50000000),
('00000000-0000-0000-0000-000000000001', 'BNB', 20.00000000, 18.00000000, 2.00000000),
('00000000-0000-0000-0000-000000000001', 'SOL', 50.00000000, 45.00000000, 5.00000000),
('00000000-0000-0000-0000-000000000001', 'ADA', 1000.00000000, 900.00000000, 100.00000000)
ON CONFLICT (user_id, asset) DO UPDATE SET
  total_balance = EXCLUDED.total_balance,
  available_balance = EXCLUDED.available_balance,
  locked_balance = EXCLUDED.locked_balance,
  updated_at = NOW();

-- Insert sample positions for demo
INSERT INTO positions (user_id, symbol, side, size, entry_price, mark_price) VALUES
('00000000-0000-0000-0000-000000000001', 'BTC/USDT', 'long', 0.05000000, 42000.00000000, 43250.00000000),
('00000000-0000-0000-0000-000000000001', 'ETH/USDT', 'long', 2.00000000, 2500.00000000, 2650.00000000)
ON CONFLICT (user_id, symbol) DO UPDATE SET
  size = EXCLUDED.size,
  entry_price = EXCLUDED.entry_price,
  mark_price = EXCLUDED.mark_price,
  updated_at = NOW();

-- Insert sample orders for demo
INSERT INTO orders (user_id, symbol, side, type, size, price, status) VALUES
('00000000-0000-0000-0000-000000000001', 'BTC/USDT', 'buy', 'limit', 0.01000000, 42500.00000000, 'pending'),
('00000000-0000-0000-0000-000000000001', 'ETH/USDT', 'sell', 'limit', 1.00000000, 2700.00000000, 'pending'),
('00000000-0000-0000-0000-000000000001', 'SOL/USDT', 'buy', 'limit', 10.00000000, 95.00000000, 'filled')
ON CONFLICT DO NOTHING;

-- Insert sample market data
INSERT INTO market_data (symbol, price, change_24h, change_percent_24h, volume_24h, high_24h, low_24h) VALUES
('BTCUSDT', 43250.50, 1250.30, 2.98, 2500000000, 44100.00, 42000.00),
('ETHUSDT', 2650.75, -45.25, -1.68, 1200000000, 2720.00, 2580.00),
('BNBUSDT', 315.20, 8.45, 2.76, 450000000, 320.50, 305.80),
('SOLUSDT', 98.45, 3.20, 3.36, 380000000, 102.30, 94.20),
('XRPUSDT', 0.6234, 0.0156, 2.56, 890000000, 0.6450, 0.6100),
('ADAUSDT', 0.4567, -0.0123, -2.62, 340000000, 0.4720, 0.4450)
ON CONFLICT (symbol) DO UPDATE SET
  price = EXCLUDED.price,
  change_24h = EXCLUDED.change_24h,
  change_percent_24h = EXCLUDED.change_percent_24h,
  volume_24h = EXCLUDED.volume_24h,
  high_24h = EXCLUDED.high_24h,
  low_24h = EXCLUDED.low_24h,
  updated_at = NOW();

-- Verify setup
SELECT 'Users' as table_name, count(*) as record_count FROM users
UNION ALL
SELECT 'Balances', count(*) FROM balances
UNION ALL
SELECT 'Positions', count(*) FROM positions
UNION ALL
SELECT 'Orders', count(*) FROM orders
UNION ALL
SELECT 'Market Data', count(*) FROM market_data;
