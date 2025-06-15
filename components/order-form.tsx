import React, { useState, useCallback, useEffect } from 'react';
import { OrderSide, OrderType, ProOrderSettings, OrderEstimate } from '../types/trading';

interface OrderFormProps {
  symbol: string;
  onPlaceOrder: (
    side: OrderSide,
    type: OrderType,
    size: number,
    price?: number,
    proSettings?: ProOrderSettings
  ) => Promise<void>;
  onGetEstimate: (
    side: OrderSide,
    type: OrderType,
    size: number,
    price?: number
  ) => Promise<OrderEstimate>;
  isLoading: boolean;
  error: string | null;
}

export function OrderForm({
  symbol,
  onPlaceOrder,
  onGetEstimate,
  isLoading,
  error
}: OrderFormProps) {
  const [side, setSide] = useState<OrderSide>('buy');
  const [type, setType] = useState<OrderType>('market');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [estimate, setEstimate] = useState<OrderEstimate | null>(null);
  const [proSettings, setProSettings] = useState<ProOrderSettings>({
    postOnly: false,
    reduceOnly: false,
    hidden: false,
    fillOrKill: false
  });

  // Update estimate when inputs change
  useEffect(() => {
    const updateEstimate = async () => {
      if (!size || (type === 'limit' && !price)) return;

      try {
        const estimate = await onGetEstimate(
          side,
          type,
          parseFloat(size),
          type === 'limit' ? parseFloat(price) : undefined
        );
        setEstimate(estimate);
      } catch (err) {
        console.error('Error getting estimate:', err);
      }
    };

    const timeoutId = setTimeout(updateEstimate, 500);
    return () => clearTimeout(timeoutId);
  }, [side, type, size, price, onGetEstimate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!size || (type === 'limit' && !price)) return;

    try {
      await onPlaceOrder(
        side,
        type,
        parseFloat(size),
        type === 'limit' ? parseFloat(price) : undefined,
        type === 'market' ? undefined : proSettings
      );
      // Reset form
      setSize('');
      setPrice('');
      setEstimate(null);
    } catch (err) {
      console.error('Error placing order:', err);
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSize(value);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPrice(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-800 rounded-lg">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 rounded ${
            side === 'buy'
              ? 'bg-green-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 rounded ${
            side === 'sell'
              ? 'bg-red-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Order Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as OrderType)}
          className="w-full bg-gray-700 text-white rounded p-2"
        >
          <option value="market">Market</option>
          <option value="limit">Limit</option>
          <option value="twap">TWAP</option>
          <option value="iceberg">Iceberg</option>
          <option value="post-only">Post Only</option>
          <option value="fill-or-kill">Fill or Kill</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Size
        </label>
        <input
          type="text"
          value={size}
          onChange={handleSizeChange}
          placeholder="0.00"
          className="w-full bg-gray-700 text-white rounded p-2"
          required
        />
      </div>

      {type === 'limit' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Price
          </label>
          <input
            type="text"
            value={price}
            onChange={handlePriceChange}
            placeholder="0.00"
            className="w-full bg-gray-700 text-white rounded p-2"
            required
          />
        </div>
      )}

      {type !== 'market' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Advanced Settings
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={proSettings.postOnly}
                onChange={(e) =>
                  setProSettings((prev) => ({
                    ...prev,
                    postOnly: e.target.checked
                  }))
                }
                className="form-checkbox"
              />
              <span className="text-sm text-gray-300">Post Only</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={proSettings.reduceOnly}
                onChange={(e) =>
                  setProSettings((prev) => ({
                    ...prev,
                    reduceOnly: e.target.checked
                  }))
                }
                className="form-checkbox"
              />
              <span className="text-sm text-gray-300">Reduce Only</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={proSettings.hidden}
                onChange={(e) =>
                  setProSettings((prev) => ({
                    ...prev,
                    hidden: e.target.checked
                  }))
                }
                className="form-checkbox"
              />
              <span className="text-sm text-gray-300">Hidden</span>
            </label>
          </div>
        </div>
      )}

      {estimate && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-300">
            <span>Estimated Cost:</span>
            <span>${estimate.estimatedCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Estimated Slippage:</span>
            <span>${estimate.estimatedSlippage.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Estimated Fees:</span>
            <span>${estimate.estimatedFees.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-green-400 font-medium">
            <span>Total Cost:</span>
            <span>${estimate.totalCost.toLocaleString()}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading || !size || (type === 'limit' && !price)}
        className={`w-full py-2 rounded font-medium ${
          side === 'buy'
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-red-500 hover:bg-red-600'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Placing Order...' : `${side.toUpperCase()} ${type.toUpperCase()}`}
      </button>
    </form>
  );
} 