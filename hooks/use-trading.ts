"use client"

import { useState, useEffect, useMemo } from 'react'
import { MockDataService } from '../services/mock-data'
import {
  Order,
  Position,
  OrderBook,
  Trade,
  OrderSide,
  OrderType,
  ProOrderSettings,
  OrderEstimate,
  Balance
} from '../types/trading'

export function useTrading(symbol: string) {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Create a stable instance of MockDataService
  const mockService = useMemo(() => new MockDataService(), [])

  useEffect(() => {
    let isSubscribed = true

    try {
      // Subscribe to order book updates
      const unsubscribeOrderBook = mockService.subscribeToOrderBook((data) => {
        if (isSubscribed) {
          setOrderBook(data)
        }
      })

      // Subscribe to trades updates
      const unsubscribeTrades = mockService.subscribeToTrades((data) => {
        if (isSubscribed) {
          setTrades(data)
        }
      })

      // Subscribe to positions updates
      const unsubscribePositions = mockService.subscribeToPositions((data) => {
        if (isSubscribed) {
          setPositions(data)
        }
      })

      // Subscribe to balances updates
      const unsubscribeBalances = mockService.subscribeToBalances((data) => {
        if (isSubscribed) {
          setBalances(data)
        }
      })

      // Subscribe to orders updates
      const unsubscribeOrders = mockService.subscribeToOrders((data) => {
        if (isSubscribed) {
          setOrders(data)
        }
      })

      setIsConnected(true)

      // Cleanup function
      return () => {
        isSubscribed = false
        unsubscribeOrderBook()
        unsubscribeTrades()
        unsubscribePositions()
        unsubscribeBalances()
        unsubscribeOrders()
        mockService.destroy()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize trading service')
      setIsConnected(false)
    }
  }, [mockService])

  const placeOrder = async (order: Omit<Order, 'id' | 'timestamp' | 'status' | 'filledSize'>) => {
    try {
      return await mockService.placeOrder(order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order')
      throw err
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      await mockService.cancelOrder(orderId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
      throw err
    }
  }

  const getOrderEstimate = async (
    side: OrderSide,
    type: OrderType,
    size: number,
    price?: number
  ): Promise<OrderEstimate> => {
    try {
      return await mockService.getOrderEstimate(symbol, side, type, size, price)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    orderBook,
    trades,
    positions,
    balances,
    orders,
    error,
    isConnected,
    placeOrder,
    cancelOrder,
    getOrderEstimate
  }
}
