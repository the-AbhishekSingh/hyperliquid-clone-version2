"use client"

import { useEffect, useState } from "react"
import type { Token } from "@/data/tokens"

interface TradeData {
  id: string
  price: number
  size: number
  side: "buy" | "sell"
  timestamp: number
}

interface RealTimeTradesProps {
  trades: TradeData[]
  isConnected: boolean
  selectedToken: Token
}

export function RealTimeTrades({ trades, isConnected, selectedToken }: RealTimeTradesProps) {
  const [highlightedTrades, setHighlightedTrades] = useState<Set<string>>(new Set())

  // Highlight new trades
  useEffect(() => {
    if (trades.length === 0) return

    const latestTrade = trades[0]
    if (latestTrade) {
      setHighlightedTrades(new Set([latestTrade.id]))

      // Clear highlight after animation
      const timeout = setTimeout(() => {
        setHighlightedTrades(new Set())
      }, 1000)

      return () => clearTimeout(timeout)
    }
  }, [trades])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with real-time indicator */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 flex-1">
            <span>Price ({selectedToken.quoteAsset})</span>
            <span className="text-right">Size ({selectedToken.baseAsset})</span>
            <span className="text-right">Time</span>
          </div>
          <div className="flex items-center ml-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? "bg-green-500" : "bg-yellow-500"}`}
            ></div>
            <span className="text-xs text-slate-400 ml-1">{isConnected ? "LIVE" : "SIM"}</span>
          </div>
        </div>
      </div>

      {/* Trades list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1">
          {trades.map((trade) => {
            const isHighlighted = highlightedTrades.has(trade.id)
            const isBuy = trade.side === "buy"

            return (
              <div
                key={trade.id}
                className={`grid grid-cols-3 gap-2 text-xs font-mono py-1 hover:bg-slate-800/50 transition-all duration-300 ${
                  isHighlighted ? `${isBuy ? "bg-green-500/20" : "bg-red-500/20"} animate-pulse` : ""
                }`}
              >
                <span className={`transition-colors duration-200 ${isBuy ? "text-green-400" : "text-red-400"}`}>
                  {Number.parseFloat(trade.price.toString()).toFixed(
                    Number.parseFloat(trade.price.toString()) > 1 ? 2 : 6,
                  )}
                </span>
                <span className="text-right text-slate-300">{Number.parseFloat(trade.size.toString()).toFixed(4)}</span>
                <span className="text-right text-slate-400">{formatTime(trade.timestamp)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Real-time footer */}
      <div className="px-3 py-2 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Trades: {trades.length}</span>
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
