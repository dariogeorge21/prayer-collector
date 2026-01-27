import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AdminProvider } from '@/contexts/AdminContext'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Faith Tracker',
  description: 'Track your daily rosary prayers, holy mass attendance, and personal prayer time',
  keywords: ['prayer', 'rosary', 'faith', 'church', 'spiritual', 'tracker'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-white font-sans antialiased">
        <AdminProvider>
          {children}
          <Toaster />
        </AdminProvider>
      </body>
    </html>
  )
}
