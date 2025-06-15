import { 
  Order, 
  Position, 
  OrderSide, 
  OrderType, 
  OrderValidation,
  OrderEstimate,
  ProOrderSettings
} from '../types/trading';

export class TradingService {
  private orders: Map<string, Order> = new Map();
  private positions: Map<string, Position> = new Map();
  private ws: WebSocket | null = null;

  constructor(private apiKey: string, private apiSecret: string) {}

  // Order Execution
  async placeOrder(
    symbol: string,
    side: OrderSide,
    type: OrderType,
    size: number,
    price?: number,
    proSettings?: ProOrderSettings
  ): Promise<Order> {
    // Validate order
    const validation = await this.validateOrder(symbol, side, type, size, price, proSettings);
    if (!validation.isValid) {
      throw new Error(`Invalid order: ${validation.errors.join(', ')}`);
    }

    // Get order estimate
    const estimate = await this.getOrderEstimate(symbol, side, type, size, price);
    
    // Create order object
    const order: Order = {
      id: this.generateOrderId(),
      symbol,
      side,
      type,
      status: 'open',
      price,
      size,
      filledSize: 0,
      remainingSize: size,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...proSettings
    };

    // Place order via API
    try {
      const response = await this.sendOrderToAPI(order);
      this.orders.set(order.id, order);
      return order;
    } catch (error) {
      throw new Error(`Failed to place order: ${error.message}`);
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    try {
      await this.sendCancelToAPI(orderId);
      order.status = 'cancelled';
      order.updatedAt = Date.now();
      this.orders.set(orderId, order);
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // Position Management
  async updatePosition(symbol: string, size: number, price: number): Promise<Position> {
    const currentPosition = this.positions.get(symbol);
    
    if (!currentPosition) {
      // Create new position
      const newPosition: Position = {
        symbol,
        size,
        entryPrice: price,
        markPrice: price,
        liquidationPrice: this.calculateLiquidationPrice(size, price),
        unrealizedPnL: 0,
        realizedPnL: 0,
        marginUsed: this.calculateMarginUsed(size, price),
        leverage: 1 // Default leverage
      };
      this.positions.set(symbol, newPosition);
      return newPosition;
    }

    // Update existing position
    const newSize = currentPosition.size + size;
    const newEntryPrice = this.calculateNewEntryPrice(
      currentPosition.size,
      currentPosition.entryPrice,
      size,
      price
    );

    const updatedPosition: Position = {
      ...currentPosition,
      size: newSize,
      entryPrice: newEntryPrice,
      marginUsed: this.calculateMarginUsed(newSize, newEntryPrice),
      liquidationPrice: this.calculateLiquidationPrice(newSize, newEntryPrice)
    };

    this.positions.set(symbol, updatedPosition);
    return updatedPosition;
  }

  // Order Validation
  private async validateOrder(
    symbol: string,
    side: OrderSide,
    type: OrderType,
    size: number,
    price?: number,
    proSettings?: ProOrderSettings
  ): Promise<OrderValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (size <= 0) {
      errors.push('Order size must be greater than 0');
    }

    if (type === 'limit' && !price) {
      errors.push('Limit orders require a price');
    }

    // Check sufficient margin
    const position = this.positions.get(symbol);
    const requiredMargin = this.calculateRequiredMargin(symbol, side, size, price);
    if (requiredMargin > this.getAvailableMargin()) {
      errors.push('Insufficient margin');
    }

    // Pro order validation
    if (proSettings) {
      if (proSettings.postOnly && proSettings.reduceOnly) {
        errors.push('Cannot set both postOnly and reduceOnly');
      }

      if (proSettings.executionTime && proSettings.executionTime < 60) {
        errors.push('Execution time must be at least 60 seconds');
      }

      if (proSettings.icebergSize && proSettings.icebergSize >= size) {
        errors.push('Iceberg size must be smaller than total order size');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Helper Methods
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateNewEntryPrice(
    currentSize: number,
    currentEntryPrice: number,
    newSize: number,
    newPrice: number
  ): number {
    if (currentSize + newSize === 0) return 0;
    return ((currentSize * currentEntryPrice) + (newSize * newPrice)) / (currentSize + newSize);
  }

  private calculateLiquidationPrice(size: number, entryPrice: number): number {
    // Implement liquidation price calculation based on your margin requirements
    return entryPrice * 0.5; // Simplified example
  }

  private calculateMarginUsed(size: number, price: number): number {
    // Implement margin calculation based on your requirements
    return Math.abs(size * price * 0.1); // 10% margin example
  }

  private calculateRequiredMargin(
    symbol: string,
    side: OrderSide,
    size: number,
    price?: number
  ): number {
    // Implement required margin calculation
    return Math.abs(size * (price || 0) * 0.1); // 10% margin example
  }

  private getAvailableMargin(): number {
    // Implement available margin calculation
    return 1000000; // Example value
  }

  // API Communication
  private async sendOrderToAPI(order: Order): Promise<any> {
    // Implement API call to Hyperliquid
    return Promise.resolve({ success: true });
  }

  private async sendCancelToAPI(orderId: string): Promise<any> {
    // Implement API call to Hyperliquid
    return Promise.resolve({ success: true });
  }

  private async getOrderEstimate(
    symbol: string,
    side: OrderSide,
    type: OrderType,
    size: number,
    price?: number
  ): Promise<OrderEstimate> {
    // Implement order estimation logic
    return {
      estimatedCost: size * (price || 0),
      estimatedSlippage: 0,
      estimatedFees: size * (price || 0) * 0.001, // 0.1% fee example
      totalCost: size * (price || 0) * 1.001
    };
  }
} 