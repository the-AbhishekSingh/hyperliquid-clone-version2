import React from 'react';
import { Order } from '../types/trading';

interface OrdersProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
}

const getOrderTypeColor = (type: string | undefined) => {
  if (!type) return 'text-gray-400';
  switch (type.toLowerCase()) {
    case 'limit':
      return 'text-blue-400';
    case 'market':
      return 'text-green-400';
    case 'stop':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

const getOrderStatusColor = (status: string | undefined) => {
  if (!status) return 'text-gray-400';
  switch (status.toLowerCase()) {
    case 'open':
      return 'text-green-400';
    case 'filled':
      return 'text-blue-400';
    case 'cancelled':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export function Orders({ orders, onCancelOrder }: OrdersProps) {
  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const getOrderSideColor = (side: 'buy' | 'sell') => {
    return side === 'buy' ? 'text-green-400' : 'text-red-400';
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await onCancelOrder(orderId);
    } catch (error) {
      console.error('Error canceling order:', error);
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No orders
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between px-2 py-1 text-xs text-gray-400 border-b border-gray-700">
        <div className="flex-1">Type</div>
        <div className="flex-1">Price</div>
        <div className="flex-1">Size</div>
        <div className="flex-1">Status</div>
        <div className="flex-1">Time</div>
        <div className="w-20"></div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {orders.map(order => (
          <div
            key={order.id}
            className="flex justify-between items-center px-2 py-1 text-sm border-b border-gray-700 hover:bg-gray-800"
          >
            <div className={`flex-1 ${getOrderTypeColor(order.type)}`}>
              {order.type || 'Unknown'}
            </div>
            <div className="flex-1">
              {order.price ? order.price.toFixed(2) : 'Market'}
            </div>
            <div className="flex-1">{order.size.toFixed(4)}</div>
            <div className={`flex-1 ${getOrderStatusColor(order.status)}`}>
              {order.status || 'Unknown'}
            </div>
            <div className="flex-1">
              {new Date(order.timestamp).toLocaleTimeString()}
            </div>
            <div className="w-20">
              {order.status === 'open' && (
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 