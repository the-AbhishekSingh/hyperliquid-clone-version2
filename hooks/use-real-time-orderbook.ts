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
  const priceRef = useRef<number>(token.price || 0)

  // Generate fallback order book
  const generateFallbackOrderBook = useCallback((basePrice: number) => {
    if (!basePrice || basePrice <= 0) {
      console.warn("Invalid base price for order book:", basePrice)
      return null
    }

    const spread = basePrice * 0.001 // 0.1% spread
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

  // Simulate order book updates
  const simulateOrderBookUpdates = useCallback(() => {
    if (!orderBook || !priceRef.current) return

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

  // Initialize order book
  useEffect(() => {
    // Get initial price from token
    const initialPrice = token.price || 0
    priceRef.current = initialPrice
    console.log(`Initializing order book for ${token.symbol} with price:`, initialPrice)
    
    const fallbackOrderBook = generateFallbackOrderBook(initialPrice)
    if (fallbackOrderBook) {
      setOrderBook(fallbackOrderBook)
    }

    // Try to connect to real WebSocket
    connectOrderBookWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [token.binanceSymbol, token.symbol])

  // Update order book when token price changes
  useEffect(() => {
    if (!isConnected && orderBook && token.price && token.price !== priceRef.current) {
      console.log(`Updating order book for ${token.symbol} with new price:`, token.price)
      priceRef.current = token.price
      const updatedOrderBook = generateFallbackOrderBook(token.price)
      if (updatedOrderBook) {
        setOrderBook(updatedOrderBook)
      }
    }
  }, [token.price, isConnected, orderBook, token.symbol])

  // Real-time simulation when not connected
  useEffect(() => {
    if (isConnected || !priceRef.current) return

    const interval = setInterval(() => {
      simulateOrderBookUpdates()
    }, 500) // Update every 500ms for real-time feel

    return () => clearInterval(interval)
  }, [isConnected, simulateOrderBookUpdates])

  // Connect to order book WebSocket
  const connectOrderBookWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // First, get the initial order book snapshot
    fetch(`https://api.binance.com/api/v3/depth?symbol=${token.binanceSymbol}&limit=20`)
      .then(response => response.json())
      .then(data => {
        if (data.bids && data.asks) {
          const bids = data.bids.map(([price, size]: [string, string]) => ({
            price: Number(price),
            size: Number(size),
            total: 0,
          }))

          const asks = data.asks.map(([price, size]: [string, string]) => ({
            price: Number(price),
            size: Number(size),
            total: 0,
          }))

          // Calculate totals
          let bidTotal = 0
          bids.forEach((bid: OrderBookEntry) => {
            bidTotal += bid.size
            bid.total = bidTotal
          })

          let askTotal = 0
          asks.forEach((ask: OrderBookEntry) => {
            askTotal += ask.size
            ask.total = askTotal
          })

          const spread = asks[0]?.price - bids[0]?.price || 0

          setOrderBook({
            bids,
            asks: asks.reverse(),
            spread,
            spreadPercent: bids[0]?.price ? (spread / bids[0].price) * 100 : 0,
            lastUpdateId: data.lastUpdateId,
          })

          lastUpdateIdRef.current = data.lastUpdateId
        }
      })
      .catch(error => {
        console.error("Error fetching initial order book:", error)
      })

    // Then connect to WebSocket for real-time updates
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${token.binanceSymbol.toLowerCase()}@depth@100ms`)

    ws.onopen = () => {
      console.log(`✅ Connected to order book WebSocket for ${token.symbol}`)
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.e === "depthUpdate") {
          // Only process updates that are newer than our last update
          if (data.u <= lastUpdateIdRef.current) {
            return
          }

          const bids = data.b.map(([price, size]: [string, string]) => ({
            price: Number(price),
            size: Number(size),
            total: 0,
          }))

          const asks = data.a.map(([price, size]: [string, string]) => ({
            price: Number(price),
            size: Number(size),
            total: 0,
          }))

          setOrderBook((prevOrderBook) => {
            if (!prevOrderBook) return null

            // Update bids
            const updatedBids = [...prevOrderBook.bids]
            bids.forEach((bid) => {
              const index = updatedBids.findIndex((b) => b.price === bid.price)
              if (index !== -1) {
                if (bid.size === 0) {
                  updatedBids.splice(index, 1)
                } else {
                  updatedBids[index] = bid
                }
              } else if (bid.size > 0) {
                updatedBids.push(bid)
              }
            })

            // Update asks
            const updatedAsks = [...prevOrderBook.asks]
            asks.forEach((ask) => {
              const index = updatedAsks.findIndex((a) => a.price === ask.price)
              if (index !== -1) {
                if (ask.size === 0) {
                  updatedAsks.splice(index, 1)
                } else {
                  updatedAsks[index] = ask
                }
              } else if (ask.size > 0) {
                updatedAsks.push(ask)
              }
            })

            // Sort and calculate totals
            updatedBids.sort((a, b) => b.price - a.price)
            updatedAsks.sort((a, b) => a.price - b.price)

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
              lastUpdateId: data.u,
            }
          })

          lastUpdateIdRef.current = data.u
        }
      } catch (error) {
        console.warn("Error processing order book update:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("❌ Order book WebSocket error:", error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log("Order book WebSocket closed")
      setIsConnected(false)
    }

    wsRef.current = ws
  }, [token.binanceSymbol, token.symbol])

  return {
    orderBook,
    isConnected,
    reconnect: connectOrderBookWebSocket,
  }
}
