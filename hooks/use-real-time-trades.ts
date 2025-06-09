"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Token } from "@/data/tokens"

interface TradeData {
  id: string
  price: number
  size: number
  side: "buy" | "sell"
  timestamp: number
}

interface WebSocketTradeData {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  t: number // Trade ID
  p: string // Price
  q: string // Quantity
  b: number // Buyer order ID
  a: number // Seller order ID
  T: number // Trade time
  m: boolean // Is buyer maker
}

export function useRealTimeTrades(token: Token) {
  const [trades, setTrades] = useState<TradeData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())

  // Generate fallback trades
  const generateFallbackTrades = useCallback((basePrice: number) => {
    const fallbackTrades: TradeData[] = []
    const now = Date.now()
    lastUpdateRef.current = now

    for (let i = 0; i < 50; i++) {
      const price = basePrice + (Math.random() - 0.5) * basePrice * 0.01
      const size = Math.random() * 10 + 0.1
      const side = Math.random() > 0.5 ? "buy" : "sell"
      const timestamp = now - i * 1000

      fallbackTrades.push({
        id: `trade_${timestamp}_${i}`,
        price,
        size,
        side,
        timestamp,
      })
    }

    return fallbackTrades
  }, [])

  // Real-time trade simulation
  const simulateNewTrade = useCallback(() => {
    const basePrice = 43250 // Default price
    const price = basePrice + (Math.random() - 0.5) * basePrice * 0.001
    const size = Math.random() * 5 + 0.1
    const side = Math.random() > 0.5 ? "buy" : "sell"
    const now = Date.now()
    lastUpdateRef.current = now

    const newTrade: TradeData = {
      id: `sim_trade_${now}_${Math.random()}`,
      price,
      size,
      side,
      timestamp: now,
    }

    setTrades((prevTrades) => [newTrade, ...prevTrades.slice(0, 49)])
  }, [])

  // Connect to trades WebSocket
  const connectTradesWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    console.log(`🔌 Connecting to trades WebSocket for ${token.symbol}...`)

    try {
      const wsUrl = `wss://stream.binance.com:9443/ws/${token.binanceSymbol.toLowerCase()}@trade`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log(`✅ Trades WebSocket connected for ${token.symbol}`)
        setIsConnected(true)
        lastUpdateRef.current = Date.now()
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketTradeData = JSON.parse(event.data)

          if (data.e === "trade") {
            const price = Number.parseFloat(data.p)
            const size = Number.parseFloat(data.q)
            const side = data.m ? "sell" : "buy" // If buyer is maker, then it's a sell
            const now = Date.now()
            lastUpdateRef.current = now

            if (!isNaN(price) && !isNaN(size) && price > 0 && size > 0) {
              const newTrade: TradeData = {
                id: `${data.t}`,
                price,
                size,
                side,
                timestamp: now,
              }

              setTrades((prevTrades) => [newTrade, ...prevTrades.slice(0, 49)])
            }
          }
        } catch (error) {
          console.warn("Error parsing trades WebSocket message:", error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error(`❌ Trades WebSocket error for ${token.symbol}:`, error)
        setIsConnected(false)
      }

      wsRef.current.onclose = () => {
        console.log(`🔌 Trades WebSocket disconnected for ${token.symbol}`)
        setIsConnected(false)

        // Reconnect after delay
        setTimeout(() => {
          connectTradesWebSocket()
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to create trades WebSocket connection:", error)
      setIsConnected(false)
    }
  }, [token])

  // Initialize trades
  useEffect(() => {
    // Generate immediate fallback trades
    const fallbackTrades = generateFallbackTrades(43250)
    setTrades(fallbackTrades)

    // Try to connect to real WebSocket
    connectTradesWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [token.binanceSymbol])

  // Real-time simulation when not connected
  useEffect(() => {
    if (isConnected) return

    const interval = setInterval(
      () => {
        simulateNewTrade()
      },
      Math.random() * 2000 + 1000,
    ) // Random interval 1-3 seconds

    return () => clearInterval(interval)
  }, [isConnected, simulateNewTrade])

  return {
    trades,
    isConnected,
    lastUpdateTime: lastUpdateRef.current,
    reconnect: connectTradesWebSocket,
  }
}
