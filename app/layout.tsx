import type { Metadata } from 'next'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import Navigation from '@/components/Navigation'
import SessionProvider from '@/components/SessionProvider'
import { AdminModeProvider } from '@/contexts/AdminModeContext'

export const metadata: Metadata = {
  title: 'Swing Decoder Handicap Tracker',
  description: 'Track your golf handicap and analyze your swing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <AdminModeProvider>
            <Navigation />
            {children}
          </AdminModeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
