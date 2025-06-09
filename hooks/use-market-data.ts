"use client"

import { useState, useEffect } from "react"

export interface MarketData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap: number
  high24h: number
  low24h: number
}

export interface OrderBookEntry {
  price: number
  size: number
  total: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number
  spreadPercent: number
}

export interface Trade {
  id: string
  price: number
  size: number
  side: "buy" | "sell"
  timestamp: number
}

export function useMarketData() {
  const [marketData, setMarketData] = useState<MarketData>({
    symbol: "HYPE/USDC",
    price: 37.158,
    change24h: 1.722,
    changePercent24h: 4.86,
    volume24h: 141801105.54,
    marketCap: 12468245561,
    high24h: 38.2,
    low24h: 35.8,
  })

  const [orderBook, setOrderBook] = useState<OrderBook>({
    bids: [
      { price: 37.155, size: 30.0, total: 30.0 },
      { price: 37.154, size: 96.44, total: 126.44 },
      { price: 37.153, size: 6.0, total: 132.44 },
      { price: 37.152, size: 31.39, total: 163.83 },
      { price: 37.151, size: 96.44, total: 260.27 },
      { price: 37.15, size: 4950.19, total: 5210.46 },
      { price: 37.149, size: 31.39, total: 5241.85 },
      { price: 37.148, size: 405.56, total: 5647.41 },
    ],
    asks: [
      { price: 37.16, size: 31.39, total: 31.39 },
      { price: 37.161, size: 8.06, total: 580.81 },
      { price: 37.169, size: 31.39, total: 572.75 },
      { price: 37.17, size: 107.29, total: 541.36 },
      { price: 37.175, size: 61.39, total: 374.07 },
      { price: 37.171, size: 175.5, total: 312.68 },
      { price: 37.17, size: 5.51, total: 137.18 },
      { price: 37.169, size: 37.5, total: 131.67 },
    ],
    spread: 0.005,
    spreadPercent: 0.013,
  })

  const [recentTrades, setRecentTrades] = useState<Trade[]>([])

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData((prev) => {
        const priceChange = (Math.random() - 0.5) * 0.02
        const newPrice = Math.max(0, prev.price + priceChange)
        const change24h = newPrice - 36.436 // Base price for 24h calculation

        return {
          ...prev,
          price: Number(newPrice.toFixed(3)),
          change24h: Number(change24h.toFixed(3)),
          changePercent24h: Number(((change24h / 36.436) * 100).toFixed(2)),
        }
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Simulate order book updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderBook((prev) => {
        const newBids = prev.bids.map((bid) => ({
          ...bid,
          size: Math.max(0.1, bid.size + (Math.random() - 0.5) * 10),
          price: bid.price + (Math.random() - 0.5) * 0.001,
        }))

        const newAsks = prev.asks.map((ask) => ({
          ...ask,
          size: Math.max(0.1, ask.size + (Math.random() - 0.5) * 10),
          price: ask.price + (Math.random() - 0.5) * 0.001,
        }))

        // Recalculate totals
        let runningTotal = 0
        newBids.forEach((bid) => {
          runningTotal += bid.size
          bid.total = runningTotal
        })

        runningTotal = 0
        newAsks.forEach((ask) => {
          runningTotal += ask.size
          ask.total = runningTotal
        })

        const spread = newAsks[0]?.price - newBids[0]?.price || 0

        return {
          bids: newBids,
          asks: newAsks,
          spread: Number(spread.toFixed(3)),
          spreadPercent: Number(((spread / newBids[0]?.price) * 100).toFixed(3)),
        }
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  // Simulate new trades
  useEffect(() => {
    const interval = setInterval(() => {
      const newTrade: Trade = {
        id: Date.now().toString(),
        price: marketData.price + (Math.random() - 0.5) * 0.01,
        size: Math.random() * 100 + 1,
        side: Math.random() > 0.5 ? "buy" : "sell",
        timestamp: Date.now(),
      }

      setRecentTrades((prev) => [newTrade, ...prev.slice(0, 49)])
    }, 3000)

    return () => clearInterval(interval)
  }, [marketData.price])

  return {
    marketData,
    orderBook,
    recentTrades,
  }
}
