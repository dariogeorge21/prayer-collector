'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  AdminSession,
  getAdminSession,
  logoutAdmin,
  verifyAdminSession,
  refreshAdminSession,
  loginWithPasswordOnly,
} from '@/lib/admin-auth'

interface AdminContextType {
  isAdmin: boolean
  session: AdminSession | null
  isLoading: boolean
  login: (password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refresh: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      setIsLoading(true)
      try {
        const { valid, session: validSession } = await verifyAdminSession()
        if (valid && validSession) {
          setSession(validSession)
        } else {
          setSession(null)
        }
      } catch {
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  // Refresh session periodically (every 5 minutes)
  useEffect(() => {
    if (!session) return

    const interval = setInterval(() => {
      const refreshed = refreshAdminSession()
      if (refreshed) {
        setSession(refreshed)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [session])

  const login = useCallback(async (password: string) => {
    setIsLoading(true)
    try {
      const result = await loginWithPasswordOnly(password)
      if (result.success && result.session) {
        setSession(result.session)
        return { success: true }
      }
      return { success: false, error: result.error }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    logoutAdmin()
    setSession(null)
  }, [])

  const refresh = useCallback(() => {
    const currentSession = getAdminSession()
    setSession(currentSession)
  }, [])

  return (
    <AdminContext.Provider
      value={{
        isAdmin: !!session,
        session,
        isLoading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
