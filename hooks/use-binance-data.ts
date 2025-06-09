"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Token } from "@/data/tokens"

export interface BinanceTickerData {
  symbol: string
  price: string
  priceChange: string
  priceChangePercent: string
  volume: string
  quoteVolume: string
  openPrice: string
  highPrice: string
  lowPrice: string
  count: string
}

export interface ProcessedMarketData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  openPrice: number
}

export interface ProcessedOrderBook {
  bids: { price: number; size: number; total: number }[]
  asks: { price: number; size: number; total: number }[]
  spread: number
  spreadPercent: number
}

export function useBinanceData(selectedToken: Token) {
  const [marketData, setMarketData] = useState<ProcessedMarketData | null>(null)
  const [orderBook, setOrderBook] = useState<ProcessedOrderBook | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUsingRealData, setIsUsingRealData] = useState(false)
  const initRef = useRef(false)

  // Get base price for fallback
  const getBasePrice = useCallback((symbol: string) => {
    const priceMap: { [key: string]: number } = {
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
    return priceMap[symbol] || Math.random() * 100 + 10
  }, [])

  // Generate immediate fallback data
  const generateFallbackData = useCallback(() => {
    const basePrice = getBasePrice(selectedToken.binanceSymbol)
    const volatility = 0.02
    const priceChange = (Math.random() - 0.5) * 2 * volatility
    const currentPrice = basePrice * (1 + priceChange)

    const change24h = currentPrice - basePrice * 0.995
    const changePercent24h = (change24h / (basePrice * 0.995)) * 100

    const fallbackData: ProcessedMarketData = {
      symbol: selectedToken.symbol,
      price: currentPrice,
      change24h,
      changePercent24h,
      volume24h: Math.random() * 500000000 + 100000000,
      high24h: currentPrice * 1.025,
      low24h: currentPrice * 0.975,
      openPrice: basePrice * 0.995,
    }

    setMarketData(fallbackData)
    setIsUsingRealData(false)
    console.log(`📊 Generated fallback data for ${selectedToken.symbol}:`, fallbackData)
  }, [selectedToken, getBasePrice])

  // Generate fallback order book
  const generateFallbackOrderBook = useCallback(() => {
    const basePrice = marketData?.price || getBasePrice(selectedToken.binanceSymbol)
    const spread = basePrice * 0.001

    const bids = []
    const asks = []
    let bidTotal = 0
    let askTotal = 0

    for (let i = 0; i < 10; i++) {
      const bidPrice = basePrice - spread / 2 - i * spread * 0.1
      const bidSize = Math.random() * 100 + 10
      bidTotal += bidSize
      bids.push({ price: bidPrice, size: bidSize, total: bidTotal })

      const askPrice = basePrice + spread / 2 + i * spread * 0.1
      const askSize = Math.random() * 100 + 10
      askTotal += askSize
      asks.push({ price: askPrice, size: askSize, total: askTotal })
    }

    setOrderBook({
      bids,
      asks: asks.reverse(),
      spread,
      spreadPercent: (spread / basePrice) * 100,
    })
  }, [marketData?.price, selectedToken.binanceSymbol, getBasePrice])

  // Fetch real Binance ticker data
  const fetchTickerData = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // Shorter timeout

      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedToken.binanceSymbol}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data: BinanceTickerData = await response.json()

        const price = Number.parseFloat(data.price)
        const change24h = Number.parseFloat(data.priceChange)
        const changePercent24h = Number.parseFloat(data.priceChangePercent)
        const volume24h = Number.parseFloat(data.quoteVolume)
        const high24h = Number.parseFloat(data.highPrice)
        const low24h = Number.parseFloat(data.lowPrice)
        const openPrice = Number.parseFloat(data.openPrice)

        if (!isNaN(price) && price > 0 && !isNaN(change24h) && !isNaN(changePercent24h)) {
          const processedData: ProcessedMarketData = {
            symbol: selectedToken.symbol,
            price,
            change24h,
            changePercent24h,
            volume24h: volume24h || 0,
            high24h: high24h || price * 1.02,
            low24h: low24h || price * 0.98,
            openPrice: openPrice || price * 0.99,
          }

          setMarketData(processedData)
          setIsUsingRealData(true)
          setError(null)
          console.log(`✅ Real data for ${selectedToken.symbol}:`, processedData)
          return true
        }
      }

      throw new Error(`API returned invalid data`)
    } catch (err) {
      console.warn(`❌ Failed to fetch real data for ${selectedToken.symbol}:`, err)
      return false
    }
  }, [selectedToken])

  // Fetch real Binance order book
  const fetchOrderBook = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(
        `https://api.binance.com/api/v3/depth?symbol=${selectedToken.binanceSymbol}&limit=20`,
        {
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        if (data.bids && data.asks && Array.isArray(data.bids) && Array.isArray(data.asks)) {
          let bidTotal = 0
          const processedBids = data.bids.map(([price, size]: [string, string]) => {
            const priceNum = Number.parseFloat(price)
            const sizeNum = Number.parseFloat(size)
            bidTotal += sizeNum
            return { price: priceNum, size: sizeNum, total: bidTotal }
          })

          let askTotal = 0
          const processedAsks = data.asks.map(([price, size]: [string, string]) => {
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
          })
          return true
        }
      }

      throw new Error("Invalid order book data")
    } catch (err) {
      return false
    }
  }, [selectedToken.binanceSymbol])

  // Initialize data immediately
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    console.log(`🚀 Initializing data for ${selectedToken.symbol}...`)

    // Set fallback data immediately
    generateFallbackData()
    generateFallbackOrderBook()

    // Try to fetch real data in background
    const loadRealData = async () => {
      setIsLoading(true)
      const tickerSuccess = await fetchTickerData()
      const orderBookSuccess = await fetchOrderBook()

      if (!tickerSuccess) {
        setError("Using simulated data - Binance API unavailable")
      }

      if (!orderBookSuccess) {
        generateFallbackOrderBook()
      }

      setIsLoading(false)
    }

    loadRealData()
  }, []) // Only run once

  // Handle token changes
  useEffect(() => {
    console.log(`🔄 Token changed to ${selectedToken.symbol}`)

    // Immediately set fallback data for new token
    generateFallbackData()
    generateFallbackOrderBook()

    // Try to fetch real data
    const loadData = async () => {
      const tickerSuccess = await fetchTickerData()
      const orderBookSuccess = await fetchOrderBook()

      if (!tickerSuccess) {
        setError("Using simulated data - Binance API unavailable")
      }

      if (!orderBookSuccess) {
        generateFallbackOrderBook()
      }
    }

    loadData()
  }, [selectedToken.binanceSymbol])

  // Periodic updates
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = []

    // Real data updates every 10 seconds
    intervals.push(
      setInterval(async () => {
        const success = await fetchTickerData()
        if (!success) {
          generateFallbackData()
        }
      }, 10000),
    )

    // Order book updates every 5 seconds
    intervals.push(
      setInterval(async () => {
        const success = await fetchOrderBook()
        if (!success) {
          generateFallbackOrderBook()
        }
      }, 5000),
    )

    // Smooth price updates every 2 seconds
    intervals.push(
      setInterval(() => {
        if (marketData) {
          const microChange = (Math.random() - 0.5) * 0.001 // ±0.05%
          const newPrice = marketData.price * (1 + microChange)

          setMarketData((prev) =>
            prev
              ? {
                  ...prev,
                  price: newPrice,
                  high24h: Math.max(prev.high24h, newPrice),
                  low24h: Math.min(prev.low24h, newPrice),
                }
              : null,
          )
        }
      }, 2000),
    )

    return () => {
      intervals.forEach(clearInterval)
    }
  }, [marketData])

  return {
    marketData,
    orderBook,
    isLoading,
    error,
    isUsingRealData,
    refetch: async () => {
      const tickerSuccess = await fetchTickerData()
      const orderBookSuccess = await fetchOrderBook()

      if (!tickerSuccess) {
        generateFallbackData()
      }
      if (!orderBookSuccess) {
        generateFallbackOrderBook()
      }
    },
  }
}
