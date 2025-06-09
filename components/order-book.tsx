"use client"

interface OrderBookEntry {
  price: number
  size: number
  total: number
}

interface ProcessedOrderBook {
  asks: OrderBookEntry[]
  bids: OrderBookEntry[]
  spread: number
  spreadPercent: number
}

interface OrderBookProps {
  orderBook: ProcessedOrderBook
}

export function OrderBook({ orderBook }: OrderBookProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b border-slate-700">
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
          <span>Price ({orderBook.asks[0]?.price > 1 ? "2" : "6"} decimals)</span>
          <span className="text-right">Size</span>
          <span className="text-right">Total</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Asks (Sell Orders) */}
        <div className="h-1/2 overflow-y-auto">
          <div className="px-3 py-1">
            {orderBook.asks
              .slice()
              .reverse()
              .map((ask, i) => (
                <div
                  key={i}
                  className="grid grid-cols-3 gap-2 text-xs font-mono py-0.5 hover:bg-slate-800/50 cursor-pointer relative"
                >
                  <div
                    className="absolute inset-y-0 right-0 bg-red-500/10"
                    style={{
                      width: `${Math.min(100, (ask.total / Math.max(...orderBook.asks.map((a) => a.total))) * 100)}%`,
                    }}
                  />
                  <span className="text-red-400 relative z-10">{ask.price.toFixed(ask.price > 1 ? 2 : 6)}</span>
                  <span className="text-right text-slate-300 relative z-10">{ask.size.toFixed(4)}</span>
                  <span className="text-right text-slate-400 relative z-10">{ask.total.toFixed(4)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Spread */}
        <div className="px-3 py-2 border-y border-slate-700 bg-slate-800/30">
          <div className="text-xs text-center">
            <span className="text-slate-400">Spread</span>
            <span className="ml-2 text-slate-300">{orderBook.spread.toFixed(6)}</span>
            <span className="ml-2 text-slate-400">{orderBook.spreadPercent.toFixed(3)}%</span>
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="h-1/2 overflow-y-auto">
          <div className="px-3 py-1">
            {orderBook.bids.map((bid, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-2 text-xs font-mono py-0.5 hover:bg-slate-800/50 cursor-pointer relative"
              >
                <div
                  className="absolute inset-y-0 right-0 bg-green-500/10"
                  style={{
                    width: `${Math.min(100, (bid.total / Math.max(...orderBook.bids.map((b) => b.total))) * 100)}%`,
                  }}
                />
                <span className="text-green-400 relative z-10">{bid.price.toFixed(bid.price > 1 ? 2 : 6)}</span>
                <span className="text-right text-slate-300 relative z-10">{bid.size.toFixed(4)}</span>
                <span className="text-right text-slate-400 relative z-10">{bid.total.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
