'use client'

import { ReactNode } from 'react'

interface BackgroundLayoutProps {
  children: ReactNode
  showBackground?: boolean
}

export function BackgroundLayout({ 
  children, 
  showBackground = true 
}: BackgroundLayoutProps) {
  return (
    <div className="relative min-h-screen w-full">
      {/* Background Image Layer */}
      {showBackground && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/jesus-picture.jpg)' }}
          aria-hidden="true"
        />
      )}
      
      {/* White Overlay with Blur Effect */}
      {showBackground && (
        <div 
          className="fixed inset-0 z-10 bg-white/85 backdrop-blur-sm"
          aria-hidden="true"
        />
      )}
      
      {/* Main Content Container */}
      <main className="relative z-20 min-h-screen">
        <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
