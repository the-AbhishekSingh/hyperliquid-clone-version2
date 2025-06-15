import type { Metadata } from 'next'
import './globals.css'
import { Web3Provider } from './providers/web3-provider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
