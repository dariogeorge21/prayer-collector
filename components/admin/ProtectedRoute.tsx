'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/contexts/AdminContext'
import { Loader2, ShieldX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminLoginModal } from './AdminLoginModal'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  showLoginPrompt?: boolean
}

export function ProtectedRoute({
  children,
  redirectTo = '/',
  showLoginPrompt = true,
}: ProtectedRouteProps) {
  const { isAdmin, isLoading } = useAdmin()
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    // If not loading and not admin and no login prompt, redirect
    if (!isLoading && !isAdmin && !showLoginPrompt) {
      router.push(redirectTo)
    }
  }, [isAdmin, isLoading, router, redirectTo, showLoginPrompt])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-500">Verifying access...</p>
      </div>
    )
  }

  // Show access denied with login option
  if (!isAdmin && showLoginPrompt) {
    return (
      <>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldX className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
            <p className="text-gray-600 mb-6">
              This page is restricted to administrators only. Please log in with admin credentials to continue.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push(redirectTo)}>
                Go Back
              </Button>
              <Button onClick={() => setShowLoginModal(true)}>
                Admin Login
              </Button>
            </div>
          </div>
        </div>

        <AdminLoginModal
          open={showLoginModal}
          onOpenChange={setShowLoginModal}
        />
      </>
    )
  }

  // Not admin and no login prompt - will redirect
  if (!isAdmin) {
    return null
  }

  // Admin - show children
  return <>{children}</>
}
