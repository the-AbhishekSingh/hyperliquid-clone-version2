"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary } from "@/components/error-boundary"
import {
  MoreHorizontal,
  Settings,
  Globe,
  BarChart3,
  Zap,
  Target,
  PenTool,
  Type,
  HelpCircle,
  Home,
  Layers,
  Filter,
  ChevronDown,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react"
import { TOKENS, type Token } from "@/data/tokens"
import { useBinanceWebSocket } from "@/hooks/use-binance-websocket"
import { useRealTimeOrderBook } from "@/hooks/use-real-time-orderbook"
import { useRealTimeTrades } from "@/hooks/use-real-time-trades"
import { useRealTimeKlines } from "@/hooks/use-real-time-klines"
import { useTrading } from "@/hooks/use-trading"
import { TokenSelector } from "@/components/token-selector"
import { RealTimeChart } from "@/components/real-time-chart"
import { RealTimeOrderBook } from "@/components/real-time-orderbook"
import { TradingPanel } from "@/components/trading-panel"
import { RealTimeTrades } from "@/components/real-time-trades"

export function TradingDashboard() {
  const [selectedToken, setSelectedToken] = useState<Token>(TOKENS[0]) // Default to BTC/USDT
  const [selectedTimeframe, setSelectedTimeframe] = useState("5")
  const [rightPanelTab, setRightPanelTab] = useState("orderbook")
  const [bottomPanelTab, setBottomPanelTab] = useState("balances")
  const [showAnnouncements, setShowAnnouncements] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Real-time WebSocket connections
  const { tickerData, getTickerData, isConnected: tickerConnected, connectionStatus } = useBinanceWebSocket(TOKENS)
  const { orderBook, isConnected: orderBookConnected } = useRealTimeOrderBook(selectedToken)
  const { trades, isConnected: tradesConnected } = useRealTimeTrades(selectedToken)
  const { klines, isConnected: klinesConnected } = useRealTimeKlines(selectedToken, "5m")
  const { orders, balances, positions } = useTrading()

  // Force re-render every second to show live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Get current token data
  const currentTokenData = getTickerData(selectedToken.binanceSymbol)

  // Create market data object with real-time updates
  const marketData = currentTokenData
    ? {
        symbol: selectedToken.symbol,
        price: currentTokenData.price,
        change24h: currentTokenData.change24h,
        changePercent24h: currentTokenData.changePercent24h,
        volume24h: currentTokenData.volume24h,
        high24h: currentTokenData.high24h,
        low24h: currentTokenData.low24h,
        openPrice: currentTokenData.openPrice,
      }
    : {
        symbol: selectedToken.symbol,
        price: 43250,
        change24h: 1250,
        changePercent24h: 2.98,
        volume24h: 2500000000,
        high24h: 44100,
        low24h: 42000,
        openPrice: 42000,
      }

  const formatNumber = (num: number, decimals = 2) => {
    if (!num || isNaN(num)) return "0.00"
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toFixed(decimals)
  }

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return "0.00"
    if (price < 1) return price.toFixed(6)
    if (price < 100) return price.toFixed(4)
    return price.toFixed(2)
  }

  // Connection status indicator
  const getConnectionStatus = () => {
    const connectedCount = [tickerConnected, orderBookConnected, tradesConnected, klinesConnected].filter(
      Boolean,
    ).length
    const totalConnections = 4

    if (connectedCount === totalConnections) return { status: "connected", color: "bg-green-500", text: "LIVE" }
    if (connectedCount > 0) return { status: "partial", color: "bg-yellow-500", text: "PARTIAL" }
    return { status: "simulated", color: "bg-blue-500", text: "SIMULATED" }
  }

  const connectionInfo = getConnectionStatus()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 text-white">
        {/* Top Navigation */}
        <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded"></div>
                <span className="font-semibold text-lg">Hyperliquid</span>
                {/* Real-time connection indicator */}
                <div className="flex items-center space-x-1 px-2 py-1 bg-slate-800 rounded-md">
                  <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <div className={`w-2 h-2 rounded-full animate-pulse ${connectionInfo.color}`}></div>
                  <span className="text-xs text-slate-300">{connectionInfo.text}</span>
                </div>
              </div>
              <nav className="flex items-center space-x-6">
                <Button variant="ghost" className="text-cyan-400 bg-cyan-400/10">
                  Trade
                </Button>
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Vaults
                </Button>
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Portfolio
                </Button>
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Staking
                </Button>
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Referrals
                </Button>
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Leaderboard
                </Button>
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  More <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="border-cyan-500 text-cyan-400">
                Connect
              </Button>
              <Button variant="ghost" size="sm">
                <Globe className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Warning Banner */}
        <div className="bg-red-900/20 border-b border-red-800 px-4 py-2 text-sm text-red-200">
          You are accessing our products and services from a restricted jurisdiction. We do not allow access from
          certain jurisdictions including locations subject to sanctions restrictions and other jurisdictions where our
          services are ineligible for use.
        </div>

        {/* Market Header */}
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <TokenSelector
                  selectedToken={selectedToken}
                  onTokenSelect={setSelectedToken}
                  priceData={getTickerData}
                  isConnected={tickerConnected}
                />
                <Badge variant="secondary" className="bg-green-900/30 text-green-400">
                  Spot
                </Badge>

                {/* Real-time price display */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-sm">
                    <span className="text-slate-400">Price:</span>
                    <span className="font-mono text-lg text-white ml-2 transition-all duration-200">
                      ${formatPrice(marketData.price)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${connectionInfo.color}`}></div>
                    <span className="text-xs text-slate-400 ml-1">{connectionInfo.text}</span>
                  </div>
                </div>
              </div>

              {/* Market data grid */}
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="text-slate-400">24h Change</div>
                  <div
                    className={`font-mono flex items-center transition-colors duration-200 ${
                      marketData.changePercent24h > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {marketData.changePercent24h > 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {marketData.change24h > 0 ? "+" : ""}
                    {marketData.change24h.toFixed(3)} / {marketData.changePercent24h > 0 ? "+" : ""}
                    {marketData.changePercent24h.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">24h Volume</div>
                  <div className="font-mono">${formatNumber(marketData.volume24h)}</div>
                </div>
                <div>
                  <div className="text-slate-400">High / Low</div>
                  <div className="font-mono text-sm">
                    <span className="text-green-400">{formatPrice(marketData.high24h)}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-red-400">{formatPrice(marketData.low24h)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-sm flex items-center space-x-4">
              <div>
                <span className="text-slate-400">Contract:</span>
                <span className="font-mono ml-1">0x6d01...11ec</span>
              </div>
              <div className="text-xs text-slate-500">Last Update: {new Date(lastUpdate).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-200px)]">
          {/* Left Sidebar - Chart Tools */}
          <div className="w-12 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-4 space-y-4">
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Zap className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Target className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <PenTool className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Type className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
              <Layers className="w-4 h-4" />
            </Button>
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 flex flex-col">
            {/* Chart Controls */}
            <div className="border-b border-slate-800 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {["1", "5", "15", "30", "60", "240", "1D"].map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={selectedTimeframe === timeframe ? "bg-cyan-600 hover:bg-cyan-700" : ""}
                    >
                      {timeframe === "1D" ? "1D" : `${timeframe}m`}
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="text-cyan-400">
                  Indicators
                </Button>
              </div>
              {/* Real-time status */}
              <div className="flex items-center space-x-2 text-sm">
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${klinesConnected ? "bg-green-500" : "bg-blue-500"}`}
                ></div>
                <span className="text-slate-400">{klinesConnected ? "Live Chart" : "Real-time Simulation"}</span>
              </div>
            </div>

            {/* Chart */}
            <div className="flex-1">
              <RealTimeChart token={selectedToken} klines={klines} marketData={marketData} height={500} />
            </div>

            {/* Time Controls */}
            <div className="border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                {["5y", "1y", "6m", "3m", "1m", "5d", "1d"].map((period) => (
                  <Button key={period} variant="ghost" size="sm" className="text-xs h-6">
                    {period}
                  </Button>
                ))}
              </div>
              <div className="text-slate-400">{new Date().toLocaleTimeString("en-US", { hour12: false })} (UTC)</div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col">
            {/* Right Panel Tabs */}
            <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="orderbook">Order Book</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
                <TabsTrigger value="more">
                  <MoreHorizontal className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orderbook" className="flex-1 flex flex-col">
                <div className="flex-1">
                  <RealTimeOrderBook orderBook={orderBook} isConnected={orderBookConnected} />
                </div>
                <div className="border-t border-slate-800">
                  <TradingPanel selectedToken={selectedToken} marketData={marketData} />
                </div>
              </TabsContent>

              <TabsContent value="trades" className="flex-1">
                <RealTimeTrades trades={trades} isConnected={tradesConnected} selectedToken={selectedToken} />
              </TabsContent>

              <TabsContent value="more" className="flex-1 p-4">
                <div className="text-center text-slate-400">Additional trading tools</div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="border-t border-slate-800 bg-slate-900/50">
          <Tabs value={bottomPanelTab} onValueChange={setBottomPanelTab} className="w-full">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="orders">Open Orders</TabsTrigger>
                <TabsTrigger value="twap">TWAP</TabsTrigger>
                <TabsTrigger value="history">Trade History</TabsTrigger>
                <TabsTrigger value="funding">Funding History</TabsTrigger>
                <TabsTrigger value="order-history">Order History</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
                <div className="flex items-center space-x-2 text-xs">
                  <input type="checkbox" className="rounded" />
                  <span>Hide Small Balances</span>
                </div>
              </div>
            </div>

            <TabsContent value="balances" className="p-4">
              <div className="grid grid-cols-5 gap-4 text-xs text-slate-400 mb-3">
                <span>Coin</span>
                <span>Total Balance</span>
                <span>Available Balance</span>
                <span>USDC Value</span>
                <span>Contract</span>
              </div>
              {balances.length > 0 ? (
                balances.map((balance) => (
                  <div key={balance.asset} className="grid grid-cols-5 gap-4 text-sm py-2 border-b border-slate-800">
                    <span className="font-mono">{balance.asset}</span>
                    <span className="font-mono">{balance.total.toFixed(4)}</span>
                    <span className="font-mono">{balance.available.toFixed(4)}</span>
                    <span className="font-mono">${balance.usdValue.toFixed(2)}</span>
                    <span className="text-slate-400">Spot</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-300">No balances yet</div>
              )}
            </TabsContent>

            <TabsContent value="positions" className="p-4">
              {positions.length > 0 ? (
                <div>
                  <div className="grid grid-cols-6 gap-4 text-xs text-slate-400 mb-3">
                    <span>Symbol</span>
                    <span>Side</span>
                    <span>Size</span>
                    <span>Entry Price</span>
                    <span>Mark Price</span>
                    <span>PnL</span>
                  </div>
                  {positions.map((position) => (
                    <div key={position.id} className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-slate-800">
                      <span className="font-mono">{position.symbol}</span>
                      <span className={position.side === "long" ? "text-green-400" : "text-red-400"}>
                        {position.side.toUpperCase()}
                      </span>
                      <span className="font-mono">{position.size.toFixed(4)}</span>
                      <span className="font-mono">${position.entryPrice.toFixed(2)}</span>
                      <span className="font-mono">${position.markPrice.toFixed(2)}</span>
                      <span className={position.pnl > 0 ? "text-green-400" : "text-red-400"}>
                        ${position.pnl.toFixed(2)} ({position.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-300">No positions</div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="p-4">
              <div className="grid grid-cols-6 gap-4 text-xs text-slate-400 mb-3">
                <span>Symbol</span>
                <span>Side</span>
                <span>Size</span>
                <span>Price</span>
                <span>Status</span>
                <span>Time</span>
              </div>
              {orders.slice(0, 10).map((order) => (
                <div key={order.id} className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-slate-800">
                  <span className="font-mono">{order.symbol}</span>
                  <span className={order.side === "buy" ? "text-green-400" : "text-red-400"}>
                    {order.side.toUpperCase()}
                  </span>
                  <span className="font-mono">{order.size.toFixed(4)}</span>
                  <span className="font-mono">{order.price?.toFixed(3) || "Market"}</span>
                  <Badge
                    variant={
                      order.status === "filled" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"
                    }
                    className="text-xs"
                  >
                    {order.status}
                  </Badge>
                  <span className="text-slate-400 text-xs">{new Date(order.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
              {orders.length === 0 && <div className="text-sm text-slate-300">No open orders</div>}
            </TabsContent>
          </Tabs>
        </div>

        {/* Real-time Status Panel */}
        {showAnnouncements && (
          <div className="fixed right-4 top-20 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
            <div className="flex items-center justify-between p-3 border-b border-slate-700">
              <span className="font-semibold flex items-center">
                <Activity className="w-4 h-4 mr-2 text-cyan-400 animate-pulse" />
                Real-time Status
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowAnnouncements(false)} className="w-6 h-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 space-y-3 text-sm max-h-96 overflow-y-auto">
              <div>
                <div className="text-cyan-400 mb-1 flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 animate-pulse ${connectionInfo.color}`}></div>
                  Data Connections
                </div>
                <div className="text-slate-400 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Ticker Data:</span>
                    <span className={tickerConnected ? "text-green-400" : "text-blue-400"}>
                      {tickerConnected ? "Live" : "Simulated"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Book:</span>
                    <span className={orderBookConnected ? "text-green-400" : "text-blue-400"}>
                      {orderBookConnected ? "Live" : "Simulated"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trades:</span>
                    <span className={tradesConnected ? "text-green-400" : "text-blue-400"}>
                      {tradesConnected ? "Live" : "Simulated"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chart Data:</span>
                    <span className={klinesConnected ? "text-green-400" : "text-blue-400"}>
                      {klinesConnected ? "Live" : "Simulated"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-cyan-400 mb-1">Real-time Updates</div>
                <div className="text-slate-400 text-xs">
                  All data updates every second with smooth animations and transitions
                </div>
              </div>
              <div>
                <div className="text-cyan-400 mb-1">Chart Display</div>
                <div className="text-slate-400 text-xs">
                  Interactive candlestick chart with real-time price line and volume bars
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
