"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { useTrading } from "@/hooks/use-trading"
import type { Token } from "@/data/tokens"

interface ProcessedMarketData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  openPrice: number
}

interface TradingPanelProps {
  selectedToken: Token
  marketData: ProcessedMarketData | null
}

export function TradingPanel({ selectedToken, marketData }: TradingPanelProps) {
  const { orderForm, updateOrderForm, placeOrder, balances } = useTrading()
  const [activeTab, setActiveTab] = useState("limit")

  const handleSizeChange = (value: string) => {
    updateOrderForm({ size: value })
  }

  const handlePriceChange = (value: string) => {
    updateOrderForm({ price: value })
  }

  const handlePercentageChange = (percentage: number[]) => {
    const percent = percentage[0]
    updateOrderForm({ percentage: percent })

    // Calculate size based on percentage of available balance
    const availableBalance = balances.find((b) => b.asset === "USDT")?.available || 0
    const price = Number.parseFloat(orderForm.price) || marketData?.price || 0
    if (price > 0) {
      const maxSize = availableBalance / price
      const calculatedSize = ((maxSize * percent) / 100).toFixed(6)
      updateOrderForm({ size: calculatedSize })
    }
  }

  const handlePlaceOrder = () => {
    if (!orderForm.size) return

    placeOrder({
      symbol: selectedToken.symbol,
      side: orderForm.side,
      type: orderForm.type,
      size: Number.parseFloat(orderForm.size),
      price: orderForm.type === "limit" ? Number.parseFloat(orderForm.price) : undefined,
    })

    // Reset form
    updateOrderForm({ size: "", price: "", percentage: 0 })
  }

  const usdtBalance = balances.find((b) => b.asset === "USDT")
  const baseBalance = balances.find((b) => b.asset === selectedToken.baseAsset)

  return (
    <div className="p-4 space-y-4">
      {/* Order Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="market" className="text-xs">
            Market
          </TabsTrigger>
          <TabsTrigger value="limit" className="text-xs">
            Limit
          </TabsTrigger>
          <TabsTrigger value="pro" className="text-xs">
            Pro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="limit" className="space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={orderForm.side === "buy" ? "default" : "outline"}
              onClick={() => updateOrderForm({ side: "buy" })}
              className={
                orderForm.side === "buy"
                  ? "bg-green-600 hover:bg-green-700"
                  : "border-green-600 text-green-400 hover:bg-green-600/10"
              }
            >
              Buy
            </Button>
            <Button
              variant={orderForm.side === "sell" ? "default" : "outline"}
              onClick={() => updateOrderForm({ side: "sell" })}
              className={
                orderForm.side === "sell"
                  ? "bg-red-600 hover:bg-red-700"
                  : "border-red-600 text-red-400 hover:bg-red-600/10"
              }
            >
              Sell
            </Button>
          </div>

          {/* Available Balance */}
          <div className="text-sm">
            <div className="text-slate-400 mb-1">Available to Trade</div>
            <div className="font-mono">
              {orderForm.side === "buy"
                ? `${usdtBalance?.available.toFixed(2) || "0.00"} USDT`
                : `${baseBalance?.available.toFixed(6) || "0.000000"} ${selectedToken.baseAsset}`}
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Price ({selectedToken.quoteAsset})</label>
            <Input
              type="number"
              value={orderForm.price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder={marketData?.price.toFixed(marketData?.price > 1 ? 2 : 6) || "0.00"}
              className="bg-slate-800 border-slate-600"
            />
          </div>

          {/* Size Input */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Size ({selectedToken.baseAsset})</label>
            <Input
              type="number"
              value={orderForm.size}
              onChange={(e) => handleSizeChange(e.target.value)}
              placeholder="0.000000"
              className="bg-slate-800 border-slate-600"
            />
          </div>

          {/* Percentage Slider */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>0%</span>
              <span>{orderForm.percentage}%</span>
              <span>100%</span>
            </div>
            <Slider
              value={[orderForm.percentage]}
              onValueChange={handlePercentageChange}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              {[25, 50, 75, 100].map((percent) => (
                <Button
                  key={percent}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePercentageChange([percent])}
                  className="text-xs h-6 px-2"
                >
                  {percent}%
                </Button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-2 text-xs border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Order Value</span>
              <span>
                {orderForm.size && orderForm.price
                  ? `${(Number.parseFloat(orderForm.size) * Number.parseFloat(orderForm.price)).toFixed(2)} ${selectedToken.quoteAsset}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Slippage</span>
              <span>Est: 0% / Max: 100%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fees</span>
              <span className="text-green-400">●● 0.0700% / 0.0400%</span>
            </div>
          </div>

          {/* Place Order Button */}
          <Button
            onClick={handlePlaceOrder}
            disabled={!orderForm.size || (orderForm.type === "limit" && !orderForm.price)}
            className={`w-full ${
              orderForm.side === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {orderForm.side === "buy" ? "Buy" : "Sell"} {selectedToken.baseAsset}
          </Button>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="text-center text-slate-400 py-8">
            Market orders execute immediately at current market price
          </div>
        </TabsContent>

        <TabsContent value="pro" className="space-y-4">
          <div className="text-center text-slate-400 py-8">Advanced trading features coming soon</div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
