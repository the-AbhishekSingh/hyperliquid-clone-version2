"use client"

import React from 'react';
import { OrderBook as OrderBookType } from '../types/trading';

interface OrderBookProps {
  data: OrderBookType | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const formatSize = (size: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(size);
};

export function OrderBook({ data }: OrderBookProps) {
  const renderLevel = (level: [number, number], isAsk: boolean) => {
    if (!level || level.length !== 2) return null;
    const [price, size] = level;
    return (
      <div
        key={price}
        className={`flex justify-between px-2 py-1 text-sm ${
          isAsk ? 'text-red-500' : 'text-green-500'
        }`}
      >
        <span>{formatPrice(price)}</span>
        <span>{formatSize(size)}</span>
      </div>
    );
  };

  if (!data || !data.asks || !data.bids) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading order book...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Bids (Buy orders) */}
      <div className="space-y-px">
        {data.bids.map(level => renderLevel(level, false))}
      </div>

      {/* Asks (Sell orders) */}
      <div className="space-y-px">
        {data.asks.slice().reverse().map(level => renderLevel(level, true))}
      </div>

      {/* Spread */}
      {data.bids.length > 0 && data.asks.length > 0 && (
        <div className="px-2 py-1 text-sm text-gray-500 border-t border-gray-800">
          Spread: {formatPrice(data.asks[0][0] - data.bids[0][0])}
        </div>
      )}
    </div>
  );
}
