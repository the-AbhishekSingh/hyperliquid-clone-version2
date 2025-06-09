"use client"

import { useEffect, useState } from "react"

interface OrderBookEntry {
  price: number
  size: number
  total: number
}

interface OrderBookData {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number
  spreadPercent: number
  lastUpdateId: number
}

interface RealTimeOrderBookProps {
  orderBook: OrderBookData | null
  isConnected: boolean
}

export function RealTimeOrderBook({ orderBook, isConnected }: RealTimeOrderBookProps) {
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(new Set())

  // Highlight changed rows
  useEffect(() => {
    if (!orderBook) return

    const newHighlights = new Set<string>()

    // Highlight top bid and ask
    if (orderBook.bids[0]) {
      newHighlights.add(`bid-${orderBook.bids[0].price}`)
    }
    if (orderBook.asks[0]) {
      newHighlights.add(`ask-${orderBook.asks[0].price}`)
    }

    setHighlightedRows(newHighlights)

    // Clear highlights after animation
    const timeout = setTimeout(() => {
      setHighlightedRows(new Set())
    }, 500)

    return () => clearTimeout(timeout)
  }, [orderBook])

  if (!orderBook) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-slate-400 text-sm">Loading order book...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with real-time indicator */}
      <div className="px-3 py-2 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400 flex-1">
            <span>Price ({orderBook.asks[0]?.price > 1 ? "2" : "6"} decimals)</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>
          <div className="flex items-center ml-2">
            <div
              className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? "bg-green-500" : "bg-yellow-500"}`}
            ></div>
            <span className="text-xs text-slate-400 ml-1">{isConnected ? "LIVE" : "SIM"}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Asks (Sell Orders) */}
        <div className="h-1/2 overflow-y-auto">
          <div className="px-3 py-1">
            {orderBook.asks
              .slice()
              .reverse()
              .map((ask, i) => {
                const isHighlighted = highlightedRows.has(`ask-${ask.price}`)
                return (
                  <div
                    key={`ask-${ask.price}-${i}`}
                    className={`grid grid-cols-3 gap-2 text-xs font-mono py-0.5 hover:bg-slate-800/50 cursor-pointer relative transition-all duration-200 ${
                      isHighlighted ? "bg-red-500/20 animate-pulse" : ""
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-red-500/10 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (ask.total / Math.max(...orderBook.asks.map((a) => a.total))) * 100)}%`,
                      }}
                    />
                    <span className="text-red-400 relative z-10 transition-colors duration-200">
                      {ask.price.toFixed(ask.price > 1 ? 2 : 6)}
                    </span>
                    <span className="text-right text-slate-300 relative z-10">{ask.size.toFixed(4)}</span>
                    <span className="text-right text-slate-400 relative z-10">{ask.total.toFixed(4)}</span>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Spread with real-time animation */}
        <div className="px-3 py-2 border-y border-slate-700 bg-slate-800/30">
          <div className="text-xs text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-slate-400">Spread</span>
              <span className="font-mono text-slate-300 bg-slate-700 px-2 py-1 rounded">
                {orderBook.spread.toFixed(6)}
              </span>
              <span className="text-slate-400">({orderBook.spreadPercent.toFixed(3)}%)</span>
              {isConnected && <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></div>}
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="h-1/2 overflow-y-auto">
          <div className="px-3 py-1">
            {orderBook.bids.map((bid, i) => {
              const isHighlighted = highlightedRows.has(`bid-${bid.price}`)
              return (
                <div
                  key={`bid-${bid.price}-${i}`}
                  className={`grid grid-cols-3 gap-2 text-xs font-mono py-0.5 hover:bg-slate-800/50 cursor-pointer relative transition-all duration-200 ${
                    isHighlighted ? "bg-green-500/20 animate-pulse" : ""
                  }`}
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-green-500/10 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (bid.total / Math.max(...orderBook.bids.map((b) => b.total))) * 100)}%`,
                    }}
                  />
                  <span className="text-green-400 relative z-10 transition-colors duration-200">
                    {bid.price.toFixed(bid.price > 1 ? 2 : 6)}
                  </span>
                  <span className="text-right text-slate-300 relative z-10">{bid.size.toFixed(4)}</span>
                  <span className="text-right text-slate-400 relative z-10">{bid.total.toFixed(4)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Real-time footer */}
      <div className="px-3 py-2 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Last Update: {new Date(orderBook.lastUpdateId).toLocaleTimeString()}</span>
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
