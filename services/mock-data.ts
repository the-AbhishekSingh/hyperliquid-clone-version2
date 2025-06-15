import { Order, Position, OrderBook, Trade, Balance } from '../types/trading'

// Mock initial data
const mockOrderBook: OrderBook = {
  bids: [
    [45000, 1.5],
    [44900, 2.3],
    [44800, 3.1],
    [44700, 1.8],
    [44600, 2.5]
  ],
  asks: [
    [45100, 1.2],
    [45200, 2.1],
    [45300, 1.8],
    [45400, 2.4],
    [45500, 1.9]
  ],
  timestamp: Date.now()
}

const mockPositions: Position[] = [
  {
    id: '1',
    symbol: 'BTC-PERP',
    side: 'long',
    size: 0.5,
    entryPrice: 45000,
    markPrice: 45100,
    pnl: 50,
    pnlPercent: 0.22
  }
]

const mockOrders: Order[] = [
  {
    id: '1',
    symbol: 'BTC-PERP',
    side: 'buy',
    type: 'limit',
    size: 0.1,
    price: 45000,
    filledSize: 0,
    status: 'pending',
    timestamp: Date.now()
  }
]

const mockBalances: Balance[] = [
  {
    asset: 'USDT',
    total: 10000,
    available: 9500,
    locked: 500,
    usdValue: 10000
  },
  {
    asset: 'BTC',
    total: 0.5,
    available: 0.5,
    locked: 0,
    usdValue: 22500
  }
]

const mockTrades: Trade[] = [
  {
    id: '1',
    symbol: 'BTC-PERP',
    side: 'buy',
    size: 0.1,
    price: 45000,
    fee: 0.0001,
    timestamp: Date.now() - 1000
  }
]

// Simulate real-time updates
export class MockDataService {
  private orderBookSubscribers: Set<(data: OrderBook) => void> = new Set()
  private tradesSubscribers: Set<(data: Trade[]) => void> = new Set()
  private positionsSubscribers: Set<(data: Position[]) => void> = new Set()
  private balancesSubscribers: Set<(data: Balance[]) => void> = new Set()
  private ordersSubscribers: Set<(data: Order[]) => void> = new Set()

  private mockOrderBook: OrderBook = {
    bids: [],
    asks: [],
    timestamp: Date.now()
  }

  private mockTrades: Trade[] = []
  private mockPositions: Position[] = []
  private mockBalances: Balance[] = []
  private mockOrders: Order[] = []
  private updateInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initializeMockData()
    this.startMockDataUpdates()
  }

  private initializeMockData() {
    // Initialize with some mock data
    const basePrice = 50000 // BTC price
    const spread = 10 // 0.02% spread

    // Generate order book levels
    for (let i = 0; i < 10; i++) {
      const bidPrice = basePrice - (i * spread)
      const askPrice = basePrice + (i * spread)
      const size = Math.random() * 2 + 0.1

      this.mockOrderBook.bids.push([bidPrice, size])
      this.mockOrderBook.asks.push([askPrice, size])
    }

    // Generate some mock trades
    for (let i = 0; i < 20; i++) {
      this.mockTrades.push({
        id: `trade-${i}`,
        price: basePrice + (Math.random() - 0.5) * 100,
        size: Math.random() * 2,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: Date.now() - i * 1000
      })
    }

    // Generate mock positions
    this.mockPositions = [{
      symbol: 'BTC/USDT',
      size: 1.5,
      entryPrice: basePrice,
      markPrice: basePrice,
      liquidationPrice: basePrice * 0.5,
      unrealizedPnl: 0,
      realizedPnl: 0,
      margin: basePrice * 0.1,
      leverage: 10
    }]

    // Generate mock balances
    this.mockBalances = [{
      asset: 'USDT',
      free: 10000,
      locked: 5000
    }]

    // Generate mock orders
    this.mockOrders = [{
      id: 'order-1',
      symbol: 'BTC/USDT',
      type: 'limit',
      side: 'buy',
      price: basePrice - 100,
      size: 0.1,
      filledSize: 0,
      status: 'open',
      timestamp: Date.now()
    }]
  }

  private startMockDataUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    this.updateInterval = setInterval(() => {
      this.updateMockData()
      this.notifySubscribers()
    }, 1000)
  }

  private updateMockData() {
    const basePrice = 50000 + (Math.random() - 0.5) * 100

    // Update order book
    this.mockOrderBook.bids = this.mockOrderBook.bids.map(([price, size]) => [
      price + (Math.random() - 0.5) * 10,
      size + (Math.random() - 0.5) * 0.1
    ])
    this.mockOrderBook.asks = this.mockOrderBook.asks.map(([price, size]) => [
      price + (Math.random() - 0.5) * 10,
      size + (Math.random() - 0.5) * 0.1
    ])
    this.mockOrderBook.timestamp = Date.now()

    // Add new trade
    this.mockTrades.unshift({
      id: `trade-${Date.now()}`,
      price: basePrice + (Math.random() - 0.5) * 100,
      size: Math.random() * 2,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: Date.now()
    })
    if (this.mockTrades.length > 20) {
      this.mockTrades.pop()
    }

    // Update positions
    this.mockPositions = this.mockPositions.map(pos => ({
      ...pos,
      markPrice: basePrice,
      unrealizedPnl: (basePrice - pos.entryPrice) * pos.size
    }))

    // Update orders
    this.mockOrders = this.mockOrders.map(order => {
      if (order.status === 'open' && Math.random() > 0.95) {
        return {
          ...order,
          status: 'filled',
          filledSize: order.size
        }
      }
      return order
    })
  }

  private notifySubscribers() {
    this.orderBookSubscribers.forEach(callback => callback(this.mockOrderBook))
    this.tradesSubscribers.forEach(callback => callback(this.mockTrades))
    this.positionsSubscribers.forEach(callback => callback(this.mockPositions))
    this.balancesSubscribers.forEach(callback => callback(this.mockBalances))
    this.ordersSubscribers.forEach(callback => callback(this.mockOrders))
  }

  // Subscription methods
  subscribeToOrderBook(callback: (data: OrderBook) => void): () => void {
    this.orderBookSubscribers.add(callback)
    callback(this.mockOrderBook)
    return () => this.orderBookSubscribers.delete(callback)
  }

  subscribeToTrades(callback: (data: Trade[]) => void): () => void {
    this.tradesSubscribers.add(callback)
    callback(this.mockTrades)
    return () => this.tradesSubscribers.delete(callback)
  }

  subscribeToPositions(callback: (data: Position[]) => void): () => void {
    this.positionsSubscribers.add(callback)
    callback(this.mockPositions)
    return () => this.positionsSubscribers.delete(callback)
  }

  subscribeToBalances(callback: (data: Balance[]) => void): () => void {
    this.balancesSubscribers.add(callback)
    callback(this.mockBalances)
    return () => this.balancesSubscribers.delete(callback)
  }

  subscribeToOrders(callback: (data: Order[]) => void): () => void {
    this.ordersSubscribers.add(callback)
    callback(this.mockOrders)
    return () => this.ordersSubscribers.delete(callback)
  }

  // Trading methods
  async placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status' | 'filledSize'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: `order-${Date.now()}`,
      timestamp: Date.now(),
      status: 'open',
      filledSize: 0
    }
    this.mockOrders.push(newOrder)
    return newOrder
  }

  async cancelOrder(orderId: string): Promise<void> {
    this.mockOrders = this.mockOrders.map(order => 
      order.id === orderId ? { ...order, status: 'cancelled' } : order
    )
  }

  // Cleanup method
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
    this.orderBookSubscribers.clear()
    this.tradesSubscribers.clear()
    this.positionsSubscribers.clear()
    this.balancesSubscribers.clear()
    this.ordersSubscribers.clear()
  }
} 