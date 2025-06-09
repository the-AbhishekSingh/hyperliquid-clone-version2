"use client"

import { useMarketData } from "@/hooks/use-market-data"
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react"

export function ChartPlaceholder() {
  const { marketData } = useMarketData()

  return (
    <div className="h-full bg-slate-950 relative overflow-hidden">
      {/* Price Grid Lines */}
      <div className="absolute inset-0">
        {[38.0, 37.5, 37.0, 36.5, 36.0, 35.5, 35.0].map((price, i) => (
          <div key={price} className="absolute w-full border-t border-slate-800/30" style={{ top: `${(i + 1) * 12}%` }}>
            <span className="absolute right-4 -top-2 text-xs text-slate-500 font-mono">{price.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {/* Simulated Candlestick Pattern */}
      <div className="absolute inset-0 flex items-end justify-center space-x-1 px-8 pb-16">
        {Array.from({ length: 50 }, (_, i) => {
          const height = Math.random() * 60 + 20
          const isGreen = Math.random() > 0.5
          return (
            <div
              key={i}
              className={`w-2 ${isGreen ? "bg-green-500" : "bg-red-500"} opacity-60`}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>

      {/* Current Price Indicator */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <div className="bg-slate-800 px-2 py-1 rounded text-sm font-mono border border-slate-600">
          ${marketData.price.toFixed(3)}
        </div>
      </div>

      {/* Center Info */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-slate-600" />
            {marketData.changePercent24h > 0 ? (
              <TrendingUp className="w-8 h-8 text-green-500 ml-2" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-500 ml-2" />
            )}
          </div>
          <div className="text-2xl font-mono text-slate-300 mb-2">{marketData.symbol}</div>
          <div className="text-lg font-mono text-slate-400 mb-1">${marketData.price.toFixed(3)}</div>
          <div className={`text-sm font-mono ${marketData.changePercent24h > 0 ? "text-green-400" : "text-red-400"}`}>
            {marketData.changePercent24h > 0 ? "+" : ""}
            {marketData.change24h.toFixed(3)}({marketData.changePercent24h > 0 ? "+" : ""}
            {marketData.changePercent24h.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Volume Indicator */}
      <div className="absolute bottom-4 left-4 text-xs text-slate-400">
        Volume: {(marketData.volume24h / 1000000).toFixed(1)}M
      </div>

      {/* Time Indicator */}
      <div className="absolute bottom-4 right-4 text-xs text-slate-400">
        {new Date().toLocaleTimeString("en-US", { hour12: false })} (UTC)
      </div>
    </div>
  )
}
