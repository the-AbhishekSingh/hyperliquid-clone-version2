import { OrderBook, Trade, Order, Position, Balance } from '../types/trading';

type WebSocketMessage = {
  type: 'orderbook' | 'trade' | 'order' | 'position' | 'balance' | 'error';
  data: any;
  symbol: string;
};

type WebSocketCallback = (data: any) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: Map<string, Set<WebSocketCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private errorCallbacks: ((error: Error) => void)[] = [];
  private orderBookCallbacks: Map<string, (book: OrderBook) => void> = new Map();
  private tradesCallbacks: Map<string, (trade: Trade) => void> = new Map();
  private ordersCallbacks: ((order: Order) => void)[] = [];
  private positionsCallbacks: ((position: Position) => void)[] = [];
  private balancesCallbacks: ((balance: Balance) => void)[] = [];

  constructor(
    private wsUrl: string,
    private apiKey: string,
    private apiSecret: string
  ) {
    if (!wsUrl) {
      throw new Error('WebSocket URL is required');
    }
    // Ensure the WebSocket URL is properly formatted
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      throw new Error('WebSocket URL must start with ws:// or wss://');
    }
  }

  connect() {
    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    try {
      this.isConnecting = true;
      if (!this.wsUrl) {
        throw new Error('WebSocket URL is not set');
      }
      this.ws = new WebSocket(this.wsUrl);
      this.setupWebSocket();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  private setupWebSocket() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.authenticate();
      this.subscribeToChannels();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.errorCallbacks.forEach(callback => callback(error as Error));
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.errorCallbacks.forEach(callback => callback(error as Error));
    };
  }

  private handleMessage(message: WebSocketMessage) {
    try {
      switch (message.type) {
        case 'orderbook':
          const orderBookCallback = this.orderBookCallbacks.get(message.symbol);
          if (orderBookCallback) {
            orderBookCallback(message.data);
          }
          break;
        case 'trade':
          const tradeCallback = this.tradesCallbacks.get(message.symbol);
          if (tradeCallback) {
            tradeCallback(message.data);
          }
          break;
        case 'order':
          this.ordersCallbacks.forEach(callback => callback(message.data));
          break;
        case 'position':
          this.positionsCallbacks.forEach(callback => callback(message.data));
          break;
        case 'balance':
          this.balancesCallbacks.forEach(callback => callback(message.data));
          break;
        case 'error':
          this.errorCallbacks.forEach(callback => callback(new Error(message.data)));
          break;
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.errorCallbacks.forEach(callback => callback(error as Error));
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff with max 30s
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.errorCallbacks.forEach(callback => {
        try {
          callback(new Error('Max reconnection attempts reached'));
        } catch (error) {
          console.error('Error in error callback:', error);
        }
      });
    }
  }

  private authenticate() {
    if (!this.ws) return;

    try {
      const timestamp = Date.now();
      const signature = this.generateSignature();
      const authMessage = {
        type: 'auth',
        apiKey: this.apiKey,
        timestamp,
        signature
      };

      this.ws.send(JSON.stringify(authMessage));
    } catch (error) {
      console.error('Error during WebSocket authentication:', error);
      this.errorCallbacks.forEach(callback => callback(error as Error));
    }
  }

  private subscribeToChannels() {
    if (!this.ws) return;

    try {
      const subscriptions = [
        { type: 'subscribe', channel: 'orderbook' },
        { type: 'subscribe', channel: 'trades' },
        { type: 'subscribe', channel: 'orders' },
        { type: 'subscribe', channel: 'positions' },
        { type: 'subscribe', channel: 'balances' }
      ];

      subscriptions.forEach(sub => {
        this.ws?.send(JSON.stringify(sub));
      });
    } catch (error) {
      console.error('Error subscribing to WebSocket channels:', error);
      this.errorCallbacks.forEach(callback => callback(error as Error));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  subscribeToOrderBook(symbol: string, callback: (orderbook: OrderBook) => void) {
    this.orderBookCallbacks.set(symbol, callback);
  }

  subscribeToTrades(symbol: string, callback: (trade: Trade) => void) {
    this.tradesCallbacks.set(symbol, callback);
  }

  subscribeToOrders(callback: (order: Order) => void) {
    this.ordersCallbacks.push(callback);
  }

  subscribeToPositions(callback: (position: Position) => void) {
    this.positionsCallbacks.push(callback);
  }

  subscribeToBalances(callback: (balance: Balance) => void) {
    this.balancesCallbacks.push(callback);
  }

  subscribeToErrors(callback: (error: Error) => void) {
    this.errorCallbacks.push(callback);
  }

  private generateSignature(): string {
    const timestamp = Date.now();
    const message = `${timestamp}${this.apiKey}`;
    // Implement your signature generation logic here
    return ''; // Placeholder
  }
} 