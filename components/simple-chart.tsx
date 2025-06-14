"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import type { Token } from "@/data/tokens"
import { useBinanceData } from "@/hooks/use-binance-data"

interface SimpleChartProps {
  token: Token
  height?: number
}

interface CandlestickData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function SimpleChart({ token, height = 500 }: SimpleChartProps) {
  const [candleData, setCandleData] = useState<CandlestickData[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(false)
  const [isUsingRealData, setIsUsingRealData] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const initRef = useRef(false)
  const { marketData } = useBinanceData(token)

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
    }
    return priceMap[symbol] || Math.random() * 100 + 10
  }, [])

  // Generate immediate fallback candlestick data
  const generateImmediateFallbackData = useCallback(() => {
    const basePrice = marketData?.price || getBasePrice(token.binanceSymbol)
    const mockData: CandlestickData[] = []
    const now = Date.now()

    for (let i = 99; i >= 0; i--) {
      const time = now - i * 5 * 60 * 1000
      const volatility = 0.02
      const priceChange = (Math.random() - 0.5) * volatility

      const open = basePrice * (1 + priceChange)
      const closeChange = (Math.random() - 0.5) * volatility * 0.5
      const close = open * (1 + closeChange)

      const high = Math.max(open, close) * (1 + Math.random() * 0.01)
      const low = Math.min(open, close) * (1 - Math.random() * 0.01)
      const volume = Math.random() * 1000000

      mockData.push({ time, open, high, low, close, volume })
    }

    setCandleData(mockData)
    setIsUsingRealData(false)
    console.log(`📊 Generated immediate chart data for ${token.symbol}`)
  }, [marketData?.price, token.binanceSymbol, getBasePrice])

  // Fetch real kline data from Binance
  const fetchRealKlineData = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${token.binanceSymbol}&interval=5m&limit=100`,
        {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        },
      )

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          const processedData: CandlestickData[] = data.map((kline: any[]) => ({
            time: kline[0],
            open: Number.parseFloat(kline[1]),
            high: Number.parseFloat(kline[2]),
            low: Number.parseFloat(kline[3]),
            close: Number.parseFloat(kline[4]),
            volume: Number.parseFloat(kline[5]),
          }))

          const isValidData = processedData.every(
            (candle) =>
              !isNaN(candle.open) &&
              !isNaN(candle.high) &&
              !isNaN(candle.low) &&
              !isNaN(candle.close) &&
              candle.open > 0 &&
              candle.high > 0 &&
              candle.low > 0 &&
              candle.close > 0,
          )

          if (isValidData) {
            setCandleData(processedData)
            setIsUsingRealData(true)
            console.log(`✅ Real chart data loaded for ${token.symbol}`)
            return true
          }
        }
      }

      throw new Error("Invalid kline data received")
    } catch (error) {
      console.warn(`Failed to fetch real chart data for ${token.symbol}:`, error)
      return false
    }
  }, [token.binanceSymbol, token.symbol])

  // Canvas drawing function
  const drawChart = useCallback(() => {
    if (!canvasRef.current || candleData.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.fillStyle = "#0f172a"
    ctx.fillRect(0, 0, rect.width, rect.height)

    const prices = candleData.flatMap((d) => [d.high, d.low])
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const priceRange = maxPrice - minPrice
    const padding = priceRange * 0.1

    const chartWidth = rect.width - 80
    const chartHeight = rect.height - 60
    const chartLeft = 40
    const chartTop = 20

    // Draw grid lines
    ctx.strokeStyle = "#334155"
    ctx.lineWidth = 0.5

    for (let i = 0; i <= 5; i++) {
      const y = chartTop + (chartHeight / 5) * i
      ctx.beginPath()
      ctx.moveTo(chartLeft, y)
      ctx.lineTo(chartLeft + chartWidth, y)
      ctx.stroke()

      const price = maxPrice + padding - ((maxPrice + padding - (minPrice - padding)) / 5) * i
      ctx.fillStyle = "#94a3b8"
      ctx.font = "12px monospace"
      ctx.textAlign = "right"
      ctx.fillText(price.toFixed(price > 1 ? 2 : 6), chartLeft - 5, y + 4)
    }

    // Draw candlesticks
    const candleWidth = Math.max(2, chartWidth / candleData.length - 1)

    candleData.forEach((candle, index) => {
      const x = chartLeft + (index * chartWidth) / candleData.length
      const openY =
        chartTop +
        chartHeight -
        ((candle.open - (minPrice - padding)) / (maxPrice + padding - (minPrice - padding))) * chartHeight
      const closeY =
        chartTop +
        chartHeight -
        ((candle.close - (minPrice - padding)) / (maxPrice + padding - (minPrice - padding))) * chartHeight
      const highY =
        chartTop +
        chartHeight -
        ((candle.high - (minPrice - padding)) / (maxPrice + padding - (minPrice - padding))) * chartHeight
      const lowY =
        chartTop +
        chartHeight -
        ((candle.low - (minPrice - padding)) / (maxPrice + padding - (minPrice - padding))) * chartHeight

      const isGreen = candle.close > candle.open
      const color = isGreen ? "#10b981" : "#ef4444"

      // Draw wick
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + candleWidth / 2, highY)
      ctx.lineTo(x + candleWidth / 2, lowY)
      ctx.stroke()

      // Draw body
      ctx.fillStyle = color
      const bodyTop = Math.min(openY, closeY)
      const bodyHeight = Math.abs(closeY - openY)
      ctx.fillRect(x, bodyTop, candleWidth, Math.max(1, bodyHeight))
    })

    // Draw current price line
    if (marketData?.price) {
      const currentPriceY =
        chartTop +
        chartHeight -
        ((marketData.price - (minPrice - padding)) / (maxPrice + padding - (minPrice - padding))) * chartHeight

      ctx.strokeStyle = "#06b6d4"
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(chartLeft, currentPriceY)
      ctx.lineTo(chartLeft + chartWidth, currentPriceY)
      ctx.stroke()
      ctx.setLineDash([])

      // Price label
      ctx.fillStyle = "#06b6d4"
      ctx.fillRect(chartLeft + chartWidth + 5, currentPriceY - 10, 60, 20)
      ctx.fillStyle = "#0f172a"
      ctx.font = "11px monospace"
      ctx.textAlign = "center"
      ctx.fillText(
        marketData.price.toFixed(marketData.price > 1 ? 2 : 6),
        chartLeft + chartWidth + 35,
        currentPriceY + 4,
      )
    }
  }, [candleData, marketData?.price])

  // Animation loop
  const animate = useCallback(() => {
    drawChart()
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [drawChart])

  // Initialize immediately
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    console.log(`🚀 Initializing chart for ${token.symbol}...`)

    // Generate immediate fallback data
    generateImmediateFallbackData()

    // Try to fetch real data in background
    const loadRealData = async () => {
      setIsInitialLoading(true)
      const success = await fetchRealKlineData()
      if (!success) {
        generateImmediateFallbackData()
      }
      setIsInitialLoading(false)
    }

    loadRealData()
  }, []) // Only run once

  // Handle token changes
  useEffect(() => {
    console.log(`🔄 Chart token changed to ${token.symbol}`)

    // Immediately generate fallback for new token
    generateImmediateFallbackData()

    // Try to fetch real data
    const loadData = async () => {
      const success = await fetchRealKlineData()
      if (!success) {
        generateImmediateFallbackData()
      }
    }

    loadData()
  }, [token.binanceSymbol])

  // Start animation when data is ready
  useEffect(() => {
    if (candleData.length > 0) {
      animate()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate, candleData.length])

  // Real-time updates
  useEffect(() => {
    if (candleData.length === 0) return

    const interval = setInterval(() => {
      if (marketData?.price) {
        setCandleData((prevData) => {
          const updatedData = [...prevData]
          const lastCandle = { ...updatedData[updatedData.length - 1] }

          // Update current candle
          lastCandle.close = marketData.price
          lastCandle.high = Math.max(lastCandle.high, marketData.price)
          lastCandle.low = Math.min(lastCandle.low, marketData.price)

          updatedData[updatedData.length - 1] = lastCandle
          return updatedData
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [marketData?.price, candleData.length])

  return (
    <div className="w-full h-full bg-slate-950 relative" style={{ height: `${height}px` }}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />

      {/* Chart info overlay */}
      <div className="absolute top-4 left-4 bg-slate-800/80 rounded-lg p-3 backdrop-blur">
        <div className="text-sm text-slate-300">
          <div className="font-mono text-lg text-white flex items-center">
            {token.symbol}
            <div
              className={`w-2 h-2 rounded-full animate-pulse ml-2 ${isUsingRealData ? "bg-green-500" : "bg-yellow-500"}`}
            ></div>
          </div>
          {marketData && (
            <>
              <div className="font-mono">${marketData.price.toFixed(marketData.price > 1 ? 2 : 6)}</div>
              <div
                className={`font-mono text-sm ${marketData.changePercent24h > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {marketData.changePercent24h > 0 ? "+" : ""}
                {marketData.changePercent24h.toFixed(2)}%
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data source indicator */}
      <div className="absolute top-4 right-4 bg-slate-800/80 rounded-lg p-2 backdrop-blur">
        <div className="text-xs flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${isUsingRealData ? "bg-green-500" : "bg-yellow-500"}`}></div>
          <span className={isUsingRealData ? "text-green-400" : "text-yellow-400"}>
            {isUsingRealData ? "LIVE BINANCE" : "SIMULATED"}
          </span>
        </div>
      </div>

      {/* Loading indicator */}
      {isInitialLoading && (
        <div className="absolute bottom-4 right-4 bg-slate-800/80 rounded-lg p-2 backdrop-blur">
          <div className="text-xs text-slate-400 flex items-center">
            <div className="w-3 h-3 border border-cyan-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span>Loading real data...</span>
          </div>
        </div>
      )}
    </div>
  )
}
