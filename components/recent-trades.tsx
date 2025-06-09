"use client"

import { useEffect, useState } from "react"
import type { Token } from "@/data/tokens"

interface RecentTradesProps {
  selectedToken: Token
}

export function RecentTrades({ selectedToken }: RecentTradesProps) {
  const [trades, setTrades] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/trades?symbol=${selectedToken.binanceSymbol}&limit=50`,
        )

        if (response.ok) {
          const data = await response.json()
          setTrades(data)
        }
      } catch (error) {
        console.error("Error fetching trades:", error)
        // Generate mock trades as fallback
        const mockTrades = Array.from({ length: 20 }, (_, i) => ({
          id: Date.now() + i,
          price: (37.158 + (Math.random() - 0.5) * 0.1).toFixed(6),
          qty: (Math.random() * 100).toFixed(4),
          time: Date.now() - i * 1000,
          isBuyerMaker: Math.random() > 0.5,
        }))
        setTrades(mockTrades)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrades()
    const interval = setInterval(fetchTrades, 5000)

    return () => clearInterval(interval)
  }, [selectedToken])

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">Loading trades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-slate-700">
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
          <span>Price ({selectedToken.quoteAsset})</span>
          <span className="text-right">Size ({selectedToken.baseAsset})</span>
          <span className="text-right">Time</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-1">
          {trades.map((trade) => (
            <div key={trade.id} className="grid grid-cols-3 gap-2 text-xs font-mono py-1 hover:bg-slate-800/50">
              <span className={!trade.isBuyerMaker ? "text-green-400" : "text-red-400"}>
                {Number.parseFloat(trade.price).toFixed(Number.parseFloat(trade.price) > 1 ? 2 : 6)}
              </span>
              <span className="text-right text-slate-300">{Number.parseFloat(trade.qty).toFixed(4)}</span>
              <span className="text-right text-slate-400">{formatTime(trade.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
