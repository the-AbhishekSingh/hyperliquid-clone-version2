import React from 'react';
import { Position } from '../types/trading';

interface PositionsProps {
  positions: Position[];
  onClosePosition: (symbol: string, type: 'market' | 'limit', price?: number) => Promise<void>;
}

export function Positions({ positions, onClosePosition }: PositionsProps) {
  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${formatNumber(num, 2)}%`;
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const handleClosePosition = async (position: Position) => {
    try {
      await onClosePosition(position.symbol, 'market');
    } catch (error) {
      console.error('Error closing position:', error);
    }
  };

  if (positions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        No open positions
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-gray-700">
        <div className="grid grid-cols-7 gap-2 text-xs text-gray-400">
          <div>Symbol</div>
          <div className="text-right">Size</div>
          <div className="text-right">Entry Price</div>
          <div className="text-right">Mark Price</div>
          <div className="text-right">PnL</div>
          <div className="text-right">Margin</div>
          <div className="text-right">Actions</div>
        </div>
      </div>

      <div className="divide-y divide-gray-700">
        {positions.map(position => (
          <div key={position.symbol} className="p-2 hover:bg-gray-700/50">
            <div className="grid grid-cols-7 gap-2 items-center text-sm">
              <div className="font-medium">
                {position.symbol}
              </div>
              
              <div className={`text-right ${position.size > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatNumber(Math.abs(position.size), 4)}
              </div>

              <div className="text-right text-gray-300">
                ${formatNumber(position.entryPrice)}
              </div>

              <div className="text-right text-gray-300">
                ${formatNumber(position.markPrice)}
              </div>

              <div className={`text-right ${getPnLColor(position.unrealizedPnL)}`}>
                <div>${formatNumber(position.unrealizedPnL)}</div>
                <div className="text-xs">
                  {formatPercentage((position.unrealizedPnL / position.marginUsed) * 100)}
                </div>
              </div>

              <div className="text-right text-gray-300">
                ${formatNumber(position.marginUsed)}
              </div>

              <div className="text-right">
                <button
                  onClick={() => handleClosePosition(position)}
                  className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Leverage: {position.leverage}x</span>
                <span>Liq. Price: ${formatNumber(position.liquidationPrice)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 