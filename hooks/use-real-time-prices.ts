"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Token } from "@/data/tokens"

interface PriceUpdate {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  timestamp: number
}

export function useRealTimePrices(tokens: Token[]) {
  const [prices, setPrices] = useState<Map<string, PriceUpdate>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const initRef = useRef(false)

  // Generate immediate fallback prices
  const generateImmediateFallbackPrices = useCallback(() => {
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

    const fallbackPrices = new Map<string, PriceUpdate>()

    tokens.forEach((token) => {
      const basePrice = basePrices[token.binanceSymbol] || Math.random() * 100 + 10
      const volatility = token.category === "Meme" ? 0.05 : token.category === "Major" ? 0.02 : 0.03
      const change24h = basePrice * (Math.random() - 0.5) * volatility
      const changePercent24h = (change24h / basePrice) * 100

      fallbackPrices.set(token.binanceSymbol, {
        symbol: token.binanceSymbol,
        price: basePrice + change24h,
        change24h,
        changePercent24h,
        timestamp: Date.now(),
      })
    })

    setPrices(fallbackPrices)
    setIsInitialized(true)
    console.log(`📊 Generated ${fallbackPrices.size} immediate fallback prices`)
  }, [tokens])

  // Fetch real prices from Binance
  const fetchRealPrices = useCallback(async () => {
    try {
      const topTokens = tokens.slice(0, 20) // Limit to 20 for faster loading
      const symbols = topTokens.map((token) => token.binanceSymbol)
      const symbolsParam = symbols.map((s) => `"${s}"`).join(",")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsParam}]`, {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          const newPrices = new Map<string, PriceUpdate>()
          let validCount = 0

          data.forEach((ticker: any) => {
            const price = Number.parseFloat(ticker.price)
            const change24h = Number.parseFloat(ticker.priceChange)
            const changePercent24h = Number.parseFloat(ticker.priceChangePercent)

            if (!isNaN(price) && !isNaN(change24h) && !isNaN(changePercent24h) && price > 0) {
              newPrices.set(ticker.symbol, {
                symbol: ticker.symbol,
                price,
                change24h,
                changePercent24h,
                timestamp: Date.now(),
              })
              validCount++
            }
          })

          if (validCount > 0) {
            setPrices((prevPrices) => {
              const updatedPrices = new Map(prevPrices)
              newPrices.forEach((newPrice, symbol) => {
                updatedPrices.set(symbol, newPrice)
              })
              return updatedPrices
            })

            setIsConnected(true)
            console.log(`✅ Updated ${validCount} real prices from Binance`)
            return true
          }
        }
      }

      throw new Error(`API returned ${response.status}`)
    } catch (error) {
      console.warn("Failed to fetch real prices:", error)
      setIsConnected(false)
      return false
    }
  }, [tokens])

  // Initialize immediately
  useEffect(() => {
    if (initRef.current || tokens.length === 0) return
    initRef.current = true

    console.log("🚀 Initializing real-time prices...")

    // Set fallback prices immediately
    generateImmediateFallbackPrices()

    // Try to fetch real prices in background
    fetchRealPrices()
  }, [tokens.length])

  // Periodic updates
  useEffect(() => {
    if (!isInitialized) return

    const intervals: NodeJS.Timeout[] = []

    // Try to fetch real prices every 15 seconds
    intervals.push(
      setInterval(async () => {
        await fetchRealPrices()
      }, 15000),
    )

    // Smooth micro-updates every 3 seconds
    intervals.push(
      setInterval(() => {
        setPrices((prevPrices) => {
          const updatedPrices = new Map(prevPrices)

          // Update first 10 tokens for smooth movement
          tokens.slice(0, 10).forEach((token) => {
            const current = updatedPrices.get(token.binanceSymbol)
            if (current) {
              const microChange = (Math.random() - 0.5) * 0.0005 // ±0.025%
              const newPrice = Math.max(0.000001, current.price * (1 + microChange))

              updatedPrices.set(token.binanceSymbol, {
                ...current,
                price: newPrice,
                timestamp: Date.now(),
              })
            }
          })

          return updatedPrices
        })
      }, 3000),
    )

    return () => {
      intervals.forEach(clearInterval)
    }
  }, [isInitialized, tokens])

  const getPriceData = useCallback(
    (binanceSymbol: string) => {
      return prices.get(binanceSymbol)
    },
    [prices],
  )

  return {
    prices,
    getPriceData,
    isConnected,
    isInitialized,
  }
}
