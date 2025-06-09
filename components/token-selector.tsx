"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Search, Star, TrendingUp, TrendingDown } from "lucide-react"
import { TOKENS, type Token, searchTokens, getTokensByCategory } from "@/data/tokens"

interface TokenSelectorProps {
  selectedToken: Token
  onTokenSelect: (token: Token) => void
  priceData: (symbol: string) => { price: number; changePercent24h: number } | undefined
  isConnected: boolean
}

export function TokenSelector({ selectedToken, onTokenSelect, priceData, isConnected }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTokens = useMemo(() => {
    let tokens = TOKENS
    if (searchQuery) {
      tokens = searchTokens(searchQuery)
    }
    return tokens.slice(0, 50) // Limit to 50 results for performance
  }, [searchQuery])

  const popularTokens = TOKENS.filter((token) =>
    ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT"].includes(token.symbol),
  )

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return "0.00"
    if (price < 1) return price.toFixed(6)
    if (price < 100) return price.toFixed(4)
    return price.toFixed(2)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-48 justify-between bg-slate-800 border-slate-600 hover:bg-slate-700"
        >
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-mono">{selectedToken.symbol}</span>
            {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0 bg-slate-800 border-slate-600" align="start">
        <Command className="bg-slate-800">
          <div className="flex items-center border-b border-slate-600 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search tokens..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <CommandList className="max-h-80">
            <CommandEmpty>No tokens found.</CommandEmpty>

            {/* Popular Tokens */}
            {!searchQuery && (
              <CommandGroup heading="Popular">
                {popularTokens.map((token) => {
                  const tokenPriceData = priceData(token.binanceSymbol)
                  return (
                    <CommandItem
                      key={token.symbol}
                      value={token.symbol}
                      onSelect={() => {
                        onTokenSelect(token)
                        setOpen(false)
                      }}
                      className="flex items-center justify-between p-2 hover:bg-slate-700 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                          {token.baseAsset.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-mono text-sm">{token.symbol}</div>
                          <div className="text-xs text-slate-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {tokenPriceData && tokenPriceData.price > 0 ? (
                          <>
                            <div className="font-mono text-sm">${formatPrice(tokenPriceData.price)}</div>
                            <div
                              className={`text-xs flex items-center ${
                                tokenPriceData.changePercent24h > 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {tokenPriceData.changePercent24h > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {tokenPriceData.changePercent24h > 0 ? "+" : ""}
                              {tokenPriceData.changePercent24h.toFixed(2)}%
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-500">Loading...</div>
                        )}
                        <Badge variant="outline" className="text-xs border-slate-600 mt-1">
                          {token.category}
                        </Badge>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* All Tokens */}
            <CommandGroup heading="All Tokens">
              {filteredTokens.map((token) => {
                const tokenPriceData = priceData(token.binanceSymbol)
                return (
                  <CommandItem
                    key={token.symbol}
                    value={token.symbol}
                    onSelect={() => {
                      onTokenSelect(token)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between p-2 hover:bg-slate-700 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                        {token.baseAsset.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-mono text-sm">{token.symbol}</div>
                        <div className="text-xs text-slate-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {tokenPriceData && tokenPriceData.price > 0 ? (
                        <>
                          <div className="font-mono text-sm">${formatPrice(tokenPriceData.price)}</div>
                          <div
                            className={`text-xs flex items-center ${
                              tokenPriceData.changePercent24h > 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {tokenPriceData.changePercent24h > 0 ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {tokenPriceData.changePercent24h > 0 ? "+" : ""}
                            {tokenPriceData.changePercent24h.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-500">Loading...</div>
                      )}
                      <Badge variant="outline" className="text-xs border-slate-600 mt-1">
                        {token.category}
                      </Badge>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>

          {/* Token Count and Connection Status */}
          <div className="border-t border-slate-600 p-2 text-xs text-slate-400 text-center flex justify-between">
            <span>
              Showing {filteredTokens.length} of {TOKENS.length} tokens
            </span>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
              <span>{isConnected ? "Live Prices" : "Offline"}</span>
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
