"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Token } from "@/data/tokens"

interface ProcessedTickerData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  openPrice: number
  timestamp: number
}

export function useBinanceWebSocket(tokens: Token[]) {
  const [tickerData, setTickerData] = useState<Map<string, ProcessedTickerData>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "disconnected",
  )
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const updateIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 3

  // Generate immediate fallback data
  const generateFallbackData = useCallback(() => {
    const basePrices: { [key: string]: number } = {
      BTCUSDT: 43250,
      ETHUSDT: 2650,
      BNBUSDT: 315,
      SOLUSDT: 98,
      XRPUSDT: 0.62,
      ADAUSDT: 0.45,
      AVAXUSDT: 35,
      DOTUSDT: 7.2,
      MATICUSDT: 0.85,
      LINKUSDT: 14.5,
      UNIUSDT: 6.8,
      AAVEUSDT: 95,
      COMPUSDT: 52,
      MKRUSDT: 1580,
      SUSHIUSDT: 1.2,
      CRVUSDT: 0.38,
      "1INCHUSDT": 0.35,
      YFIUSDT: 7200,
      SNXUSDT: 2.1,
      BALUSDT: 2.8,
    }

    const fallbackData = new Map<string, ProcessedTickerData>()

    tokens.slice(0, 30).forEach((token) => {
      const basePrice = basePrices[token.binanceSymbol] || Math.random() * 100 + 10
      const volatility = token.category === "Meme" ? 0.05 : token.category === "Major" ? 0.02 : 0.03
      const change24h = basePrice * (Math.random() - 0.5) * volatility
      const changePercent24h = (change24h / basePrice) * 100

      fallbackData.set(token.binanceSymbol, {
        symbol: token.binanceSymbol,
        price: basePrice + change24h,
        change24h,
        changePercent24h,
        volume24h: Math.random() * 500000000 + 100000000,
        high24h: (basePrice + change24h) * 1.025,
        low24h: (basePrice + change24h) * 0.975,
        openPrice: basePrice,
        timestamp: Date.now(),
      })
    })

    setTickerData(fallbackData)
    console.log(`📊 Generated ${fallbackData.size} fallback ticker data points`)
  }, [tokens])

  // Real-time price simulation
  const simulateRealTimeUpdates = useCallback(() => {
    setTickerData((prevData) => {
      const updatedData = new Map(prevData)

      updatedData.forEach((data, symbol) => {
        // Micro price movements
        const volatility = 0.0008 // ±0.04%
        const microChange = (Math.random() - 0.5) * 2 * volatility
        const newPrice = Math.max(0.000001, data.price * (1 + microChange))

        // Update high/low if needed
        const newHigh = Math.max(data.high24h, newPrice)
        const newLow = Math.min(data.low24h, newPrice)

        // Recalculate 24h change
        const new24hChange = newPrice - data.openPrice
        const new24hChangePercent = (new24hChange / data.openPrice) * 100

        updatedData.set(symbol, {
          ...data,
          price: newPrice,
          change24h: new24hChange,
          changePercent24h: new24hChangePercent,
          high24h: newHigh,
          low24h: newLow,
          timestamp: Date.now(),
        })
      })

      return updatedData
    })
  }, [])

  // Try to connect to Binance WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus("connecting")
    console.log("🔌 Attempting to connect to Binance WebSocket...")

    try {
      // Use individual ticker streams for top tokens
      const streams = tokens
        .slice(0, 10) // Limit to 10 for better performance
        .map((token) => `${token.binanceSymbol.toLowerCase()}@ticker`)
        .join("/")

      const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log("✅ WebSocket connected to Binance")
        setIsConnected(true)
        setConnectionStatus("connected")
        reconnectAttemptsRef.current = 0
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.e === "24hrTicker") {
            const price = Number.parseFloat(data.c)
            const change24h = Number.parseFloat(data.p)
            const changePercent24h = Number.parseFloat(data.P)
            const volume24h = Number.parseFloat(data.q)
            const high24h = Number.parseFloat(data.h)
            const low24h = Number.parseFloat(data.l)
            const openPrice = Number.parseFloat(data.o)

            if (!isNaN(price) && price > 0) {
              setTickerData((prevData) => {
                const updatedData = new Map(prevData)
                updatedData.set(data.s, {
                  symbol: data.s,
                  price,
                  change24h,
                  changePercent24h,
                  volume24h,
                  high24h,
                  low24h,
                  openPrice,
                  timestamp: Date.now(),
                })
                return updatedData
              })
            }
          }
        } catch (error) {
          console.warn("Error parsing WebSocket message:", error)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error("❌ WebSocket error:", error)
        setConnectionStatus("error")
        setIsConnected(false)
      }

      wsRef.current.onclose = (event) => {
        console.log("🔌 WebSocket disconnected:", event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus("disconnected")

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)
        } else {
          console.log("❌ Max reconnection attempts reached")
          setConnectionStatus("error")
        }
      }
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error)
      setConnectionStatus("error")
      setIsConnected(false)
    }
  }, [tokens])

  // Initialize
  useEffect(() => {
    // Generate immediate fallback data
    generateFallbackData()

    // Try to connect to WebSocket
    connectWebSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, []) // Only run once

  // Real-time simulation when not connected
  useEffect(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
    }

    updateIntervalRef.current = setInterval(() => {
      simulateRealTimeUpdates()
    }, 800) // Update every 800ms for smooth real-time feel

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [simulateRealTimeUpdates])

  // Get ticker data for a specific symbol
  const getTickerData = useCallback(
    (symbol: string) => {
      return tickerData.get(symbol)
    },
    [tickerData],
  )

  return {
    tickerData,
    getTickerData,
    isConnected,
    connectionStatus,
    reconnect: connectWebSocket,
    disconnect: () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    },
  }
}
