"use client"

import { useEffect, useRef } from "react"
import type { Token } from "@/data/tokens"

interface TradingViewChartProps {
  token: Token
  theme?: "light" | "dark"
  interval?: string
  height?: number
}

export function TradingViewChart({ token, theme = "dark", interval = "5", height = 500 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any existing content
    containerRef.current.innerHTML = ""

    // Create the TradingView widget script
    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
    script.async = true

    // Widget configuration
    const config = {
      autosize: true,
      symbol: `BINANCE:${token.binanceSymbol}`,
      interval: interval,
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    }

    script.innerHTML = JSON.stringify(config)

    // Add the script to the container
    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [token.binanceSymbol, theme, interval])

  return (
    <div className="w-full h-full relative bg-slate-950">
      <div ref={containerRef} className="tradingview-widget-container w-full h-full" style={{ height: `${height}px` }}>
        <div className="tradingview-widget-container__widget w-full h-full"></div>

        {/* Loading state */}
        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading {token.symbol} chart...</p>
            <p className="text-slate-500 text-sm mt-2">Powered by TradingView</p>
          </div>
        </div>
      </div>
    </div>
  )
}
