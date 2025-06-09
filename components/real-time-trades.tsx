"use client"

import { useEffect, useState, useRef } from "react"
import type { Token } from "@/data/tokens"

interface TradeData {
  id: string
  price: number
  size: number
  side: "buy" | "sell"
  timestamp: number
}

interface RealTimeTradesProps {
  trades: TradeData[] | null
  isConnected: boolean
  lastUpdateTime: number
}

export function RealTimeTrades({ trades, isConnected, lastUpdateTime }: RealTimeTradesProps) {
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(new Set())
  const tradesRef = useRef<HTMLDivElement>(null)

  // Highlight new trades
  useEffect(() => {
    if (!trades || trades.length === 0) return

    const newHighlights = new Set<string>()
    const latestTrade = trades[0]
    newHighlights.add(`${latestTrade.id}`)

    setHighlightedRows(newHighlights)

    // Clear highlights after animation
    const timeout = setTimeout(() => {
      setHighlightedRows(new Set())
    }, 500)

    return () => clearTimeout(timeout)
  }, [trades])

  // Scroll to top when new trades arrive
  useEffect(() => {
    if (tradesRef.current) {
      tradesRef.current.scrollTop = 0
    }
  }, [trades?.length])

  if (!trades) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">Loading trades...</p>
        </div>
      </div>
    )
  }

  // Only show the last 8 trades
  const recentTrades = trades.slice(0, 8)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const formatLastUpdate = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) {
      return `${seconds}s ago`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(seconds / 3600)
      return `${hours}h ago`
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with real-time indicator */}
      <div className="px-2 py-1 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 flex-1">
            <span>Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          <div className="flex items-center ml-1">
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${isConnected ? "bg-green-500" : "bg-yellow-500"}`}
            ></div>
            <span className="text-[10px] text-slate-400 ml-1">{isConnected ? "LIVE" : "SIM"}</span>
          </div>
        </div>
      </div>

      {/* Trades List */}
      <div ref={tradesRef} className="flex-1 overflow-y-auto">
        <div className="px-2 py-0.5">
          {recentTrades.map((trade) => {
            const isHighlighted = highlightedRows.has(trade.id)
            return (
              <div
                key={trade.id}
                className={`grid grid-cols-3 gap-1 text-[10px] font-mono py-0.5 hover:bg-slate-800/50 cursor-pointer relative transition-all duration-200 ${
                  isHighlighted ? "bg-slate-700/50 animate-pulse" : ""
                }`}
              >
                <span
                  className={`relative z-10 transition-colors duration-200 ${
                    trade.side === "buy" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {trade.price.toFixed(trade.price > 1 ? 2 : 6)}
                </span>
                <span className="text-right text-slate-300 relative z-10">{trade.size.toFixed(2)}</span>
                <span className="text-right text-slate-400 relative z-10">
                  {formatTime(trade.timestamp)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Real-time footer */}
      <div className="px-2 py-1 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Last Update: {formatLastUpdate(lastUpdateTime)}</span>
          <div className="flex items-center">
            <div
              className={`w-1 h-1 rounded-full mr-1 ${isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
            ></div>
            <span>{isConnected ? "Real-time" : "Simulated"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
