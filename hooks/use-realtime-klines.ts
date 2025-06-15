import { useState, useEffect } from 'react';
import { MockDataService } from '@/services/mock-data';
import type { Kline } from '@/types/trading';

export function useRealTimeKlines(symbol: string, interval: string) {
    const [klines, setKlines] = useState<Kline[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const mockService = new MockDataService();
        setIsConnected(true);

        // Generate initial mock klines
        const generateMockKlines = () => {
            const basePrice = 43250; // BTC base price
            const now = Date.now();
            const mockKlines: Kline[] = [];

            // Generate last 100 klines
            for (let i = 0; i < 100; i++) {
                const timestamp = now - (100 - i) * 5 * 60 * 1000; // 5 minutes intervals
                const open = basePrice + (Math.random() - 0.5) * 1000;
                const high = open + Math.random() * 500;
                const low = open - Math.random() * 500;
                const close = (high + low) / 2;
                const volume = Math.random() * 100 + 50;

                mockKlines.push({
                    timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume
                });
            }

            return mockKlines;
        };

        // Set initial klines
        setKlines(generateMockKlines());

        // Update klines every 5 minutes
        const interval = setInterval(() => {
            setKlines(prevKlines => {
                const newKlines = [...prevKlines];
                const lastKline = newKlines[newKlines.length - 1];
                const basePrice = lastKline.close;
                
                // Update last kline
                lastKline.high = Math.max(lastKline.high, basePrice + Math.random() * 100);
                lastKline.low = Math.min(lastKline.low, basePrice - Math.random() * 100);
                lastKline.close = (lastKline.high + lastKline.low) / 2;
                lastKline.volume += Math.random() * 10;

                return newKlines;
            });
        }, 5000); // Update every 5 seconds for smooth updates

        // Cleanup on unmount
        return () => {
            clearInterval(interval);
            setIsConnected(false);
        };
    }, [symbol, interval]);

    return {
        klines,
        isConnected
    };
} 