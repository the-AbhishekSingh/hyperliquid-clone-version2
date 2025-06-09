"use client"

import { useState, useCallback, useEffect } from "react"

export interface Position {
  id: string
  symbol: string
  side: "long" | "short"
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
  pnlPercent: number
}

export interface Order {
  id: string
  symbol: string
  side: "buy" | "sell"
  type: "market" | "limit"
  size: number
  price?: number
  filledSize: number
  status: "pending" | "filled" | "cancelled" | "partially_filled"
  timestamp: number
}

export interface Balance {
  asset: string
  total: number
  available: number
  locked: number
  usdValue: number
}

export interface Trade {
  id: string
  symbol: string
  side: "buy" | "sell"
  size: number
  price: number
  fee: number
  timestamp: number
}

export function useTrading() {
  const [positions, setPositions] = useState<Position[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [balances, setBalances] = useState<Balance[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [orderForm, setOrderForm] = useState({
    side: "buy" as "buy" | "sell",
    type: "limit" as "market" | "limit",
    size: "",
    price: "",
    percentage: 0,
  })

  // Initialize with demo data immediately
  useEffect(() => {
    console.log("🚀 Initializing trading data...")

    // Set demo balances immediately
    setBalances([
      { asset: "USDT", total: 10000, available: 8500, locked: 1500, usdValue: 10000 },
      { asset: "BTC", total: 0.25, available: 0.2, locked: 0.05, usdValue: 10812.5 },
      { asset: "ETH", total: 5, available: 4.5, locked: 0.5, usdValue: 13250 },
      { asset: "BNB", total: 20, available: 18, locked: 2, usdValue: 6304 },
      { asset: "SOL", total: 50, available: 45, locked: 5, usdValue: 4922.5 },
      { asset: "ADA", total: 1000, available: 900, locked: 100, usdValue: 456.7 },
    ])

    // Set demo positions
    setPositions([
      {
        id: "pos1",
        symbol: "BTC/USDT",
        side: "long",
        size: 0.05,
        entryPrice: 42000,
        markPrice: 43250,
        pnl: 62.5,
        pnlPercent: 2.98,
      },
      {
        id: "pos2",
        symbol: "ETH/USDT",
        side: "long",
        size: 2,
        entryPrice: 2500,
        markPrice: 2650,
        pnl: 300,
        pnlPercent: 6.0,
      },
    ])

    // Set demo orders
    setOrders([
      {
        id: "order1",
        symbol: "BTC/USDT",
        side: "buy",
        type: "limit",
        size: 0.01,
        price: 42500,
        filledSize: 0,
        status: "pending",
        timestamp: Date.now() - 300000,
      },
      {
        id: "order2",
        symbol: "ETH/USDT",
        side: "sell",
        type: "limit",
        size: 1,
        price: 2700,
        filledSize: 0,
        status: "pending",
        timestamp: Date.now() - 600000,
      },
      {
        id: "order3",
        symbol: "SOL/USDT",
        side: "buy",
        type: "limit",
        size: 10,
        price: 95,
        filledSize: 10,
        status: "filled",
        timestamp: Date.now() - 900000,
      },
    ])

    // Set demo trades
    setTrades([
      {
        id: "trade1",
        symbol: "BTC/USDT",
        side: "buy",
        size: 0.02,
        price: 42800,
        fee: 0.856,
        timestamp: Date.now() - 1200000,
      },
      {
        id: "trade2",
        symbol: "ETH/USDT",
        side: "sell",
        size: 1.5,
        price: 2580,
        fee: 3.87,
        timestamp: Date.now() - 1800000,
      },
    ])

    console.log("✅ Trading data initialized")
  }, [])

  // Place order function
  const placeOrder = useCallback(async (orderData: Omit<Order, "id" | "timestamp" | "status" | "filledSize">) => {
    try {
      setIsLoading(true)

      const newOrder: Order = {
        ...orderData,
        id: `order_${Date.now()}`,
        timestamp: Date.now(),
        status: "pending",
        filledSize: 0,
      }

      // Add order to list
      setOrders((prev) => [newOrder, ...prev])

      // Simulate order execution
      setTimeout(
        () => {
          const shouldFill = Math.random() > 0.1 // 90% fill rate

          if (shouldFill) {
            // Update order status
            setOrders((prev) =>
              prev.map((order) =>
                order.id === newOrder.id ? { ...order, status: "filled" as const, filledSize: order.size } : order,
              ),
            )

            // Add trade
            const newTrade: Trade = {
              id: `trade_${Date.now()}`,
              symbol: orderData.symbol,
              side: orderData.side,
              size: orderData.size,
              price: orderData.price || 0,
              fee: orderData.size * (orderData.price || 0) * 0.001,
              timestamp: Date.now(),
            }

            setTrades((prev) => [newTrade, ...prev])

            console.log(`✅ Order filled: ${orderData.side} ${orderData.size} ${orderData.symbol}`)
          } else {
            // Cancel order
            setOrders((prev) =>
              prev.map((order) => (order.id === newOrder.id ? { ...order, status: "cancelled" as const } : order)),
            )
            console.log(`❌ Order cancelled: ${orderData.symbol}`)
          }
        },
        Math.random() * 3000 + 2000,
      )

      return newOrder.id
    } catch (error) {
      console.error("Error placing order:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cancel order function
  const cancelOrder = useCallback(async (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: "cancelled" as const } : order)),
    )
    console.log(`🚫 Order cancelled: ${orderId}`)
  }, [])

  const updateOrderForm = useCallback((updates: Partial<typeof orderForm>) => {
    setOrderForm((prev) => ({ ...prev, ...updates }))
  }, [])

  return {
    positions,
    orders,
    balances,
    trades,
    orderForm,
    isLoading,
    placeOrder,
    cancelOrder,
    updateOrderForm,
    refetch: () => {
      console.log("🔄 Refreshing trading data...")
      // Data is already loaded, no need to refetch
    },
  }
}
