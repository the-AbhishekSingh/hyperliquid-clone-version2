import { useEffect, useState } from 'react';
import { MockDataService } from '@/services/mock-data';
import { Trade } from '@/types/trading';

export const useRealTimeTrades = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        const mockService = new MockDataService();
        setIsConnected(true);

        const unsubscribe = mockService.subscribeToTrades((trades) => {
            setTrades(trades);
            setLastUpdate(new Date());
        });

        return () => {
            unsubscribe();
            setIsConnected(false);
        };
    }, []);

    return {
        trades,
        isConnected,
        lastUpdate
    };
}; 