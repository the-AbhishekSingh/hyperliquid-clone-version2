"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Token } from "@/data/tokens"

interface OrderBookEntry {
  price: number
  size: number
  total: number
}

interface OrderBookData {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number
  spreadPercent: number
  lastUpdateId: number
}

interface WebSocketDepthData {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  U: number // First update ID
  u: number // Final update ID
  b: [string, string][] // Bids
  a: [string, string][] // Asks
}

export function useRealTimeOrderBook(token: Token) {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const lastUpdateIdRef = useRef<number>(0)

  // Generate fallback order book
  const generateFallbackOrderBook = useCallback((basePrice: number) => {
    const spread = basePrice * 0.001
    const bids: OrderBookEntry[] = []
    const asks: OrderBookEntry[] = []
    let bidTotal = 0
    let askTotal = 0

    for (let i = 0; i < 20; i++) {
      // Bids (buy orders)
      const bidPrice = basePrice - spread / 2 - i * spread * 0.1
      const bidSize = Math.random() * 100 + 10
      bidTotal += bidSize
      bids.push({ price: bidPrice, size: bidSize, total: bidTotal })

      // Asks (sell orders)
      const askPrice = basePrice + spread / 2 + i * spread * 0.1
      const askSize = Math.random() * 100 + 10
      askTotal += askSize
      asks.push({ price: askPrice, size: askSize, total: askTotal })
    }

    return {
      bids,
      asks: asks.reverse(),
      spread,
      spreadPercent: (spread / basePrice) * 100,
      lastUpdateId: Date.now(),
    }
  }, [])

  // Real-time order book simulation
  const simulateOrderBookUpdates = useCallback(() => {
    if (!orderBook) return

    setOrderBook((prevOrderBook) => {
      if (!prevOrderBook) return null

      const updatedBids = prevOrderBook.bids.map((bid) => ({
        ...bid,
        size: Math.max(0.1, bid.size + (Math.random() - 0.5) * 20),
        price: bid.price + (Math.random() - 0.5) * 0.001,
      }))

      const updatedAsks = prevOrderBook.asks.map((ask) => ({
        ...ask,
        size: Math.max(0.1, ask.size + (Math.random() - 0.5) * 20),
        price: ask.price + (Math.random() - 0.5) * 0.001,
      }))

      // Recalculate totals
      let bidTotal = 0
      updatedBids.forEach((bid) => {
        bidTotal += bid.size
        bid.total = bidTotal
      })

      let askTotal = 0
      updatedAsks.forEach((ask) => {
        askTotal += ask.size
        ask.total = askTotal
      })

      const spread = updatedAsks[0]?.price - updatedBids[0]?.price || 0

      return {
        bids: updatedBids,
        asks: updatedAsks,
        spread,
        spreadPercent: updatedBids[0]?.price ? (spread / updatedBids[0].price) * 100 : 0,
        lastUpdateId: Date.now(),
      }
    })
  }, [orderBook])

  // Connect to order book WebSocket
  const connectOrderBookWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    console.log(`🔌 Connecting to order book WebSocket for ${token.symbol}...`)

    try {
      const wsUrl = `wss://stream.binance.com:9443/ws/${token.binanceSymbol.toLowerCase()}@depth20@100ms`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log(`✅ Order book WebSocket connected for ${token.symbol}`)
        setIsConnected(true)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketDepthData = JSON.parse(event.data)

          if (data.e === "depthUpdate") {
            // Process bids
            let bidTotal = 0
            const processedBids: OrderBookEntry[] = data.b.map(([price, size]) => {
              const priceNum = Number.parseFloat(price)
              const sizeNum = Number.parseFloat(size)
              bidTotal += sizeNum
              return { price: priceNum, size: sizeNum, total: bidTotal }
            })

            // Process asks
            let askTotal = 0
            const processedAsks: OrderBookEntry[] = data.a.map(([price, size]) => {
              const priceNum = Number.parseFloat(price)
              const sizeNum = Number.parseFloat(size)
              askTotal += sizeNum
              return { price: priceNum, size: sizeNum, total: askTotal }
            })

            const spread = processedAsks[0]?.price - processedBids[0]?.price || 0
            const spreadPercent = processedBids[0]?.price ? (spread / processedBids[0].price) * 100 : 0

            setOrderBook({
              bids: processedBids,
              asks: processedAsks.reverse(),
              spread,
              spreadPercent,
              lastUpdateId: data.u,
            })

            lastUpdateIdRef.current = data.u
          }
        } catch (error) {
          console.warn("Error parsing order book WebSocket message:", error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error(`❌ Order book WebSocket error for ${token.symbol}:`, error)
        setIsConnected(false)
      }

      wsRef.current.onclose = () => {
        console.log(`🔌 Order book WebSocket disconnected for ${token.symbol}`)
        setIsConnected(false)

        // Reconnect after delay
        setTimeout(() => {
          connectOrderBookWebSocket()
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to create order book WebSocket connection:", error)
      setIsConnected(false)
    }
  }, [token])

  // Initialize order book
  useEffect(() => {
    // Generate immediate fallback
    const fallbackOrderBook = generateFallbackOrderBook(43250) // Default price
    setOrderBook(fallbackOrderBook)

    // Try to connect to real WebSocket
    connectOrderBookWebSocket()

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

    const interval = setInterval(() => {
      simulateOrderBookUpdates()
    }, 500) // Update every 500ms for real-time feel

    return () => clearInterval(interval)
  }, [isConnected, simulateOrderBookUpdates])

  return {
    orderBook,
    isConnected,
    reconnect: connectOrderBookWebSocket,
  }
}
