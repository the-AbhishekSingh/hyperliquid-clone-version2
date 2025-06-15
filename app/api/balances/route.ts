import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // For now, return mock data
    // In a real implementation, you would fetch actual balances from your backend
    const mockBalances = [
      {
        asset: 'USDT',
        total: 1000,
        available: 1000,
        inOrders: 0,
        usdValue: 1000
      },
      {
        asset: 'BTC',
        total: 0.1,
        available: 0.1,
        inOrders: 0,
        usdValue: 4000
      }
    ]

    return NextResponse.json(mockBalances)
  } catch (error) {
    console.error('Error fetching balances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    )
  }
} 