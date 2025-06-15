"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { useTrading } from "@/hooks/use-trading"
import type { Token } from "@/data/tokens"
import { useRealTimeTrades } from "@/hooks/use-realtime-trades"
import { useRealTimeKlines } from "@/hooks/use-realtime-klines"
import { useRealTimeOrderBook } from "@/hooks/use-realtime-orderbook"
import { useWeb3 } from "@/app/providers/web3-provider"
import { SiEthereum } from "react-icons/si"
import { OrderForm } from './order-form'
import { OrderBook } from './order-book'
import { Orders } from './orders'
import { Positions } from './positions'
import { Balance } from '../types/trading'
import { formatNumber } from '../lib/utils'
import { toast } from "react-hot-toast"
import { OrderSide, OrderType, ProOrderSettings } from '../types/trading'

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
  // State hooks
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [side, setSide] = useState<OrderSide>('buy')
  const [size, setSize] = useState('')
  const [price, setPrice] = useState('')
  const [showProSettings, setShowProSettings] = useState(false)
  const [proSettings, setProSettings] = useState<ProOrderSettings>({
    timeInForce: 'GTC',
    postOnly: false,
    reduceOnly: false,
    triggerPrice: undefined,
    stopLoss: undefined,
    takeProfit: undefined
  })
  const [activeTab, setActiveTab] = useState("limit")
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoadingBalances, setIsLoadingBalances] = useState(true)
  const [totalBalance, setTotalBalance] = useState(0)
  const [orderForm, setOrderForm] = useState({
    size: '',
    price: '',
    percentage: 0
  })

  // Custom hooks
  const { account, connect, disconnect, isConnected: web3Connected, isDummyAccount } = useWeb3()
  const { trades: realTimeTrades, isConnected: tradesConnected, lastUpdateTime } = useRealTimeTrades(selectedToken.symbol)
  const { orderBook: realTimeOrderBook, isConnected: orderBookConnected } = useRealTimeOrderBook(selectedToken.symbol)
  const { klines, isConnected: klinesConnected } = useRealTimeKlines(selectedToken.symbol, "5m")
  const {
    orders,
    positions,
    orderBook,
    trades,
    balances,
    isLoading,
    error,
    isConnected,
    placeOrder,
    cancelOrder,
    getOrderEstimate
  } = useTrading(selectedToken.symbol)

  const updateOrderForm = (updates: Partial<typeof orderForm>) => {
    setOrderForm(prev => ({ ...prev, ...updates }))
  }

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

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Show connection status
  useEffect(() => {
    if (!isConnected || !tradesConnected || !orderBookConnected || !klinesConnected) {
      toast('Some data streams are disconnected. Attempting to reconnect...', {
        icon: '⚠️',
        style: {
          background: '#FEF3C7',
          color: '#92400E',
        },
      })
    } else {
      toast.success('All data streams connected')
    }
  }, [isConnected, tradesConnected, orderBookConnected, klinesConnected])

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!account) {
        setIsLoadingBalances(false)
        setTotalBalance(0)
        return
      }

      try {
        setIsLoadingBalances(true)
        const response = await fetch(`/api/balances?address=${account}`)
        if (!response.ok) throw new Error('Failed to fetch balances')
        const data = await response.json()
        setTotalBalance(data.reduce((sum: number, balance: Balance) => sum + balance.usdValue, 0))
      } catch (error) {
        console.error('Error fetching balances:', error)
        setTotalBalance(0)
      } finally {
        setIsLoadingBalances(false)
      }
    }

    fetchBalances()
  }, [account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!size) return

    try {
      const orderSize = parseFloat(size)
      const orderPrice = price ? parseFloat(price) : undefined

      // Get order estimate
      const estimate = await getOrderEstimate(side, orderType, orderSize, orderPrice)
      
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Confirm ${side.toUpperCase()} order:\n` +
        `Size: ${orderSize} ${selectedToken.symbol}\n` +
        `Price: ${orderPrice ? orderPrice : 'Market'}\n` +
        `Estimated Cost: ${estimate.totalCost} USDC\n` +
        `Fees: ${estimate.fees} USDC`
      )

      if (confirmed) {
        await placeOrder(side, orderType, orderSize, orderPrice, showProSettings ? proSettings : undefined)
        toast.success('Order placed successfully')
        setSize('')
        setPrice('')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order')
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId)
      toast.success('Order cancelled successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order')
    }
  }

  const handleClosePosition = async (symbol: string, type: 'market' | 'limit', price?: number) => {
    try {
      const position = positions.find(p => p.symbol === symbol)
      if (!position) throw new Error('Position not found')

      await placeOrder(
        position.side === 'long' ? 'sell' : 'buy',
        type,
        position.size,
        price,
        { reduceOnly: true }
      )
      toast.success('Position closed successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to close position')
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return 'Not Connected'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Get base asset from selected token
  const getBaseAsset = (token: string): string => {
    try {
      return token.split('-')[0] || 'BTC'
    } catch {
      return 'BTC'
    }
  }

  // Safely get balances with null checks
  const usdtBalance = balances.find((b) => b.asset === "USDT") || { asset: "USDT", total: 0, available: 0, inOrders: 0, usdValue: 0 }
  const baseAsset = getBaseAsset(selectedToken.symbol)
  const baseBalance = balances.find((b) => b.asset === baseAsset) || { asset: baseAsset, total: 0, available: 0, inOrders: 0, usdValue: 0 }

  const handleGetEstimate = async (side: 'buy' | 'sell', type: string, size: number, price?: number) => {
    try {
      const estimate = await getOrderEstimate(side, type, size, price);
      return {
        cost: estimate.totalCost,
        fee: estimate.fees,
        slippage: 0 // You can calculate slippage if needed
      };
    } catch (err: any) {
      toast.error(err.message || 'Failed to get order estimate');
      return {
        cost: 0,
        fee: 0,
        slippage: 0
      };
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Trading Panel</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Last Update:</span>
            <span className="text-sm font-mono">
              {lastUpdate.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Connection:</span>
            <span className={`text-sm font-mono ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Connection Status:</span>
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${tradesConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Trades</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${orderBookConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Order Book</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${klinesConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Klines</span>
            </div>
          </div>
          {!web3Connected ? (
            <Button
              onClick={connect}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <SiEthereum className="w-5 h-5" />
              <span>Connect Wallet</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-400">
                  {formatAddress(account)}
                </span>
                <span className="text-xs text-green-400">
                  ${formatNumber(totalBalance)} {isDummyAccount ? '(Dummy)' : ''}
                </span>
              </div>
              <Button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500 text-white p-2 text-sm">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-12 h-full">
          {/* Left Panel - Order Book */}
          <div className="col-span-3 border-r border-gray-800">
            <OrderBook data={orderBook} onPriceClick={(price) => console.log('Price clicked:', price)} />
          </div>

          {/* Center Panel - Chart and Order Form */}
          <div className="col-span-6 flex flex-col">
            <div className="flex-1 p-4">
              {/* Chart will go here */}
              <div className="h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">Chart Component</span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800">
              <OrderForm
                symbol={selectedToken}
                onPlaceOrder={handleSubmit}
                onGetEstimate={handleGetEstimate}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>

          {/* Right Panel - Orders, Positions, and Balances */}
          <div className="col-span-3 border-l border-gray-800">
            <Tabs defaultValue="orders" className="h-full">
              <TabsList className="w-full justify-start border-b border-gray-800">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="positions">Positions</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="h-[calc(100%-40px)] overflow-y-auto">
                <Orders orders={trades} onCancelOrder={handleCancelOrder} />
              </TabsContent>

              <TabsContent value="positions" className="h-[calc(100%-40px)] overflow-y-auto">
                <Positions positions={positions} onClosePosition={handleClosePosition} />
              </TabsContent>

              <TabsContent value="balances" className="h-[calc(100%-40px)] overflow-y-auto">
                <div className="p-4">
                  <div className="grid grid-cols-5 gap-4 text-xs text-gray-400 mb-2">
                    <span>Asset</span>
                    <span className="text-right">Total</span>
                    <span className="text-right">Available</span>
                    <span className="text-right">In Orders</span>
                    <span className="text-right">USD Value</span>
                  </div>
                  {isLoadingBalances ? (
                    <div className="text-center py-4 text-gray-400">
                      Loading balances...
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-5 gap-4 text-sm py-2 border-b border-gray-800">
                        <span className="font-mono">{usdtBalance.asset}</span>
                        <span className="text-right font-mono">{formatNumber(usdtBalance.total)}</span>
                        <span className="text-right font-mono">{formatNumber(usdtBalance.available)}</span>
                        <span className="text-right font-mono">{formatNumber(usdtBalance.inOrders)}</span>
                        <span className="text-right font-mono">${formatNumber(usdtBalance.usdValue)}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm py-2 border-b border-gray-800">
                        <span className="font-mono">{baseBalance.asset}</span>
                        <span className="text-right font-mono">{formatNumber(baseBalance.total)}</span>
                        <span className="text-right font-mono">{formatNumber(baseBalance.available)}</span>
                        <span className="text-right font-mono">{formatNumber(baseBalance.inOrders)}</span>
                        <span className="text-right font-mono">${formatNumber(baseBalance.usdValue)}</span>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
