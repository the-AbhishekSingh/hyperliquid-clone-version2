"use client"

import { useEffect, useRef } from "react"
import type { Token } from "@/data/tokens"

interface MarketData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  openPrice: number
}

interface RealTimeChartProps {
  token: Token
  klines: any[]
  marketData: MarketData | null
  height?: number
}

export function RealTimeChart({ token, height = 500 }: RealTimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Remove previous widget if any
    if (containerRef.current) {
      containerRef.current.innerHTML = ""
    }
    // Create script
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol: `${token.binanceSymbol.replace("USDT", "USD")}`,
          interval: "5",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#131722",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          container_id: containerRef.current?.id || "tv_chart_container",
        })
      }
    }
    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }
  }, [token.binanceSymbol])

  return (
    <div
      ref={containerRef}
      id="tv_chart_container"
      style={{ width: "100%", height: height || 500, minHeight: 400 }}
      className="w-full h-full bg-slate-950 rounded-lg overflow-hidden"
    />
  )
}
