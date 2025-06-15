import { useState, useEffect } from 'react';
import { MockDataService } from '@/services/mock-data-service';
import { OrderBookData } from '@/types/trading';

export function useRealTimeOrderBook(symbol: string) {
    const [orderBook, setOrderBook] = useState<OrderBookData>({ bids: [], asks: [] });
    const [isConnected, setIsConnected] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    useEffect(() => {
        const mockService = MockDataService.getInstance();
        
        const unsubscribe = mockService.subscribeToOrderBook((data) => {
            setOrderBook(data);
            setLastUpdate(new Date());
            setIsConnected(true);
        });

        return () => {
            unsubscribe();
        };
    }, [symbol]);

    return { orderBook, isConnected, lastUpdate };
} 