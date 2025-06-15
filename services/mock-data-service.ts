export class MockDataService {
  private static instance: MockDataService;
  private orderBookSubscribers: Set<(data: OrderBookData) => void> = new Set();
  private tradeSubscribers: Set<(data: TradeData) => void> = new Set();
  private tickerSubscribers: Set<(data: TickerData) => void> = new Set();
  private klineSubscribers: Set<(data: KlineData) => void> = new Set();
  private isConnected: boolean = true;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private intervals: NodeJS.Timeout[] = [];

  private constructor() {
    this.startMockDataGeneration();
  }

  public static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  private startMockDataGeneration = () => {
    // Generate order book updates
    const orderBookInterval = setInterval(() => {
      if (this.orderBookSubscribers.size > 0) {
        const orderBook = this.generateMockOrderBook();
        this.orderBookSubscribers.forEach(callback => callback(orderBook));
      }
    }, 1000);
    this.intervals.push(orderBookInterval);

    // Generate trade updates
    const tradeInterval = setInterval(() => {
      if (this.tradeSubscribers.size > 0) {
        const trade: TradeData = {
          id: Date.now().toString(),
          price: 50000 + (Math.random() * 1000 - 500),
          size: Math.random() * 2,
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          timestamp: new Date().toISOString()
        };
        this.tradeSubscribers.forEach(callback => callback(trade));
      }
    }, 2000);
    this.intervals.push(tradeInterval);

    // Generate ticker updates
    const tickerInterval = setInterval(() => {
      if (this.tickerSubscribers.size > 0) {
        const ticker = this.generateMockTicker();
        this.tickerSubscribers.forEach(callback => callback(ticker));
      }
    }, 1000);
    this.intervals.push(tickerInterval);

    // Generate kline updates
    const klineInterval = setInterval(() => {
      if (this.klineSubscribers.size > 0) {
        const kline = this.generateMockKline();
        this.klineSubscribers.forEach(callback => callback(kline));
      }
    }, 5000);
    this.intervals.push(klineInterval);
  }

  private generateMockOrderBook = (): OrderBookData => {
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];
    let price = 50000;
    
    // Generate 10 bids
    for (let i = 0; i < 10; i++) {
      const bidPrice = price - (i * 100);
      const bidSize = Math.random() * 2;
      bids.push([bidPrice, bidSize]);
    }
    
    // Generate 10 asks
    for (let i = 0; i < 10; i++) {
      const askPrice = price + (i * 100);
      const askSize = Math.random() * 2;
      asks.push([askPrice, askSize]);
    }
    
    return { bids, asks };
  }

  private generateMockTicker = (): TickerData => {
    const basePrice = 50000;
    const priceChange = (Math.random() * 2000 - 1000);
    const price = basePrice + priceChange;
    const volume = Math.random() * 1000;
    
    return {
      symbol: 'BTC-USDT',
      price,
      priceChange,
      priceChangePercent: (priceChange / basePrice) * 100,
      volume,
      high: basePrice + 1000,
      low: basePrice - 1000,
      timestamp: new Date().toISOString()
    };
  }

  private generateMockKline = (): KlineData => {
    const basePrice = 50000;
    const open = basePrice + (Math.random() * 1000 - 500);
    const high = open + (Math.random() * 500);
    const low = open - (Math.random() * 500);
    const close = (high + low) / 2;
    const volume = Math.random() * 1000;
    
    return {
      timestamp: new Date().toISOString(),
      open,
      high,
      low,
      close,
      volume
    };
  }

  public subscribeToOrderBook(callback: (data: OrderBookData) => void): () => void {
    this.orderBookSubscribers.add(callback);
    // Send initial data
    callback(this.generateMockOrderBook());
    return () => this.orderBookSubscribers.delete(callback);
  }

  public subscribeToTrades(callback: (data: TradeData) => void): () => void {
    this.tradeSubscribers.add(callback);
    // Send initial data
    const initialTrade: TradeData = {
      id: Date.now().toString(),
      price: 50000 + (Math.random() * 1000 - 500),
      size: Math.random() * 2,
      side: Math.random() > 0.5 ? 'buy' : 'sell',
      timestamp: new Date().toISOString()
    };
    callback(initialTrade);
    return () => this.tradeSubscribers.delete(callback);
  }

  public subscribeToTicker(callback: (data: TickerData) => void): () => void {
    this.tickerSubscribers.add(callback);
    // Send initial data
    callback(this.generateMockTicker());
    return () => this.tickerSubscribers.delete(callback);
  }

  public subscribeToKlines(callback: (data: KlineData) => void): () => void {
    this.klineSubscribers.add(callback);
    // Send initial data
    callback(this.generateMockKline());
    return () => this.klineSubscribers.delete(callback);
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
      }, 1000);
    }
  }

  public cleanup() {
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Clear all subscribers
    this.orderBookSubscribers.clear();
    this.tradeSubscribers.clear();
    this.tickerSubscribers.clear();
    this.klineSubscribers.clear();

    // Reset connection state
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }
} 