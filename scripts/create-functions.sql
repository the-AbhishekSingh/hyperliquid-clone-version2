-- Function to update balance
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
