export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'twap' | 'iceberg' | 'post-only' | 'fill-or-kill';
export type OrderStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price?: number;  // Required for limit orders
  size: number;
  filledSize: number;
  remainingSize: number;
  averageFillPrice?: number;
  createdAt: number;
  updatedAt: number;
  reduceOnly?: boolean;
  postOnly?: boolean;
  hidden?: boolean;
  executionTime?: number;  // For TWAP orders
  icebergSize?: number;   // For iceberg orders
}

export interface Position {
  id: string;
  symbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  bids: [number, number][];
  asks: [number, number][];
  spread: number;
  lastUpdateId: number;
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  size: number;
  fee: number;
  timestamp: number;
}

export interface OrderEstimate {
  totalCost: number;
  fees: number;
  price: number;
  size: number;
  side: OrderSide;
  type: OrderType;
}

export interface OrderValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface Balance {
  asset: string;
  total: number;
  available: number;
  locked: number;
  usdValue: number;
}

export interface ProOrderSettings {
  timeInForce: "GTC" | "IOC" | "FOK";
  postOnly?: boolean;
  reduceOnly?: boolean;
  triggerPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
} 