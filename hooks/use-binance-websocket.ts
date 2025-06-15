"use client"

import { useState, useEffect, useCallback } from 'react';
import { MockDataService } from '@/services/mock-data';
import type { Token } from '@/data/tokens';

interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  openPrice: number;
}

export function useBinanceWebSocket(tokens: Token[]) {
  const [tickerData, setTickerData] = useState<Record<string, TickerData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const generateMockTickerData = useCallback((symbol: string): TickerData => {
    const basePrice = 43250; // BTC base price
    const price = basePrice + (Math.random() - 0.5) * 1000;
    const change24h = (Math.random() - 0.5) * 2000;
    const changePercent24h = (change24h / basePrice) * 100;
    const volume24h = 2500000000 + (Math.random() - 0.5) * 500000000;
    const high24h = basePrice + Math.random() * 2000;
    const low24h = basePrice - Math.random() * 2000;
    const openPrice = basePrice + (Math.random() - 0.5) * 1000;

    return {
      symbol,
      price,
      change24h,
      changePercent24h,
      volume24h,
      high24h,
      low24h,
      openPrice
    };
  }, []);

  useEffect(() => {
    const mockService = new MockDataService();
    setIsConnected(true);
    setConnectionStatus('connected');

    // Initialize ticker data for all tokens
    const initialData: Record<string, TickerData> = {};
    tokens.forEach(token => {
      initialData[token.binanceSymbol] = generateMockTickerData(token.binanceSymbol);
    });
    setTickerData(initialData);

    // Update ticker data every second
    const interval = setInterval(() => {
      const updatedData: Record<string, TickerData> = {};
      tokens.forEach(token => {
        updatedData[token.binanceSymbol] = generateMockTickerData(token.binanceSymbol);
      });
      setTickerData(updatedData);
    }, 1000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [tokens, generateMockTickerData]);

  const getTickerData = useCallback((symbol: string) => {
    return tickerData[symbol];
  }, [tickerData]);

  return {
    tickerData,
    getTickerData,
    isConnected,
    connectionStatus
  };
}
