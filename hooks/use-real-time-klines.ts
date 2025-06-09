"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Token } from "@/data/tokens"

interface KlineData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface WebSocketKlineData {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  k: {
    t: number // Kline start time
    T: number // Kline close time
    s: string // Symbol
    i: string // Interval
    f: number // First trade ID
    L: number // Last trade ID
    o: string // Open price
    c: string // Close price
    h: string // High price
    l: string // Low price
    v: string // Base asset volume
    n: number // Number of trades
    x: boolean // Is this kline closed?
    q: string // Quote asset volume
    V: string // Taker buy base asset volume
    Q: string // Taker buy quote asset volume
  }
}

export function useRealTimeKlines(token: Token, interval = "5m") {
  const [klines, setKlines] = useState<KlineData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const currentTokenRef = useRef<string>(token.binanceSymbol)

  // Generate fallback kline data
  const generateFallbackKlines = useCallback((basePrice: number) => {
    const fallbackKlines: KlineData[] = []
    const now = Date.now()
    const intervalMs = 5 * 60 * 1000 // 5 minutes

    for (let i = 100; i >= 0; i--) {
      const time = now - i * intervalMs
      const volatility = 0.02
      const priceChange = (Math.random() - 0.5) * volatility

      const open = basePrice * (1 + priceChange)
      const closeChange = (Math.random() - 0.5) * volatility * 0.5
      const close = open * (1 + closeChange)

      const high = Math.max(open, close) * (1 + Math.random() * 0.01)
      const low = Math.min(open, close) * (1 - Math.random() * 0.01)
      const volume = Math.random() * 1000000

      fallbackKlines.push({ time, open, high, low, close, volume })
    }

    return fallbackKlines
  }, [])

  // Real-time kline updates
  const updateCurrentKline = useCallback((currentPrice: number) => {
    setKlines((prevKlines) => {
      if (prevKlines.length === 0) return prevKlines

      const updatedKlines = [...prevKlines]
      const lastKline = { ...updatedKlines[updatedKlines.length - 1] }
      const currentTime = Date.now()
      const intervalMs = 5 * 60 * 1000 // 5 minutes

      // Check if we need a new kline
      if (currentTime - lastKline.time >= intervalMs) {
        // Create new kline
        const newKline: KlineData = {
          time: currentTime,
          open: lastKline.close,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          volume: Math.random() * 100000,
        }

        return [...updatedKlines.slice(1), newKline]
      } else {
        // Update current kline
        lastKline.close = currentPrice
        lastKline.high = Math.max(lastKline.high, currentPrice)
        lastKline.low = Math.min(lastKline.low, currentPrice)
        lastKline.volume += Math.random() * 10000

        updatedKlines[updatedKlines.length - 1] = lastKline
        return updatedKlines
      }
    })
  }, [])

  // Connect to klines WebSocket
  const connectKlinesWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    console.log(`🔌 Connecting to klines WebSocket for ${token.symbol}...`)

    try {
      const wsUrl = `wss://stream.binance.com:9443/ws/${token.binanceSymbol.toLowerCase()}@kline_${interval}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log(`✅ Klines WebSocket connected for ${token.symbol}`)
        setIsConnected(true)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketKlineData = JSON.parse(event.data)

          if (data.e === "kline") {
            const kline = data.k
            const open = Number.parseFloat(kline.o)
            const high = Number.parseFloat(kline.h)
            const low = Number.parseFloat(kline.l)
            const close = Number.parseFloat(kline.c)
            const volume = Number.parseFloat(kline.v)

            if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close) && !isNaN(volume)) {
              const newKlineData: KlineData = {
                time: kline.t,
                open,
                high,
                low,
                close,
                volume,
              }

              setKlines((prevKlines) => {
                const updatedKlines = [...prevKlines]

                // If this is a closed kline, add it to the array
                if (kline.x) {
                  return [...updatedKlines.slice(1), newKlineData]
                } else {
                  // Update the current kline
                  if (updatedKlines.length > 0) {
                    updatedKlines[updatedKlines.length - 1] = newKlineData
                  }
                  return updatedKlines
                }
              })
            }
          }
        } catch (error) {
          console.warn("Error parsing klines WebSocket message:", error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error(`❌ Klines WebSocket error for ${token.symbol}:`, error)
        setIsConnected(false)
      }

      wsRef.current.onclose = () => {
        console.log(`🔌 Klines WebSocket disconnected for ${token.symbol}`)
        setIsConnected(false)

        // Reconnect after delay
        setTimeout(() => {
          connectKlinesWebSocket()
        }, 2000)
      }
    } catch (error) {
      console.error("Failed to create klines WebSocket connection:", error)
      setIsConnected(false)
    }
  }, [token, interval])

  // Initialize klines
  useEffect(() => {
    if (currentTokenRef.current !== token.binanceSymbol) {
      currentTokenRef.current = token.binanceSymbol

      // Generate immediate fallback klines
      const fallbackKlines = generateFallbackKlines(43250)
      setKlines(fallbackKlines)

      // Disconnect existing WebSocket
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      // Connect to new WebSocket
      connectKlinesWebSocket()
    }

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
      const simulatedPrice = 43250 + (Math.random() - 0.5) * 1000
      updateCurrentKline(simulatedPrice)
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [isConnected, updateCurrentKline])

  return {
    klines,
    isConnected,
    reconnect: connectKlinesWebSocket,
  }
}
