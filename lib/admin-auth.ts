'use client'

import { supabase } from '@/lib/supabase'

const ADMIN_SESSION_KEY = 'faith_tracker_admin_session'
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123' // Change in production!

export interface AdminSession {
  userId: string
  name: string
  isAdmin: boolean
  expiresAt: number // Unix timestamp
}

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000

/**
 * Verify admin password and create session
 */
export async function loginAsAdmin(
  userId: string, 
  password: string
): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  try {
    // First verify the password
    if (password !== ADMIN_PASSWORD) {
      return { success: false, error: 'Invalid admin password' }
    }

    // Check if user exists and is an admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return { success: false, error: 'User not found' }
    }

    if (!user.is_admin) {
      return { success: false, error: 'User is not an admin' }
    }

    // Create session
    const session: AdminSession = {
      userId: user.id,
      name: user.name,
      isAdmin: true,
      expiresAt: Date.now() + SESSION_DURATION,
    }

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
    }

    return { success: true, session }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

/**
 * Login with password only (for any admin user)
 */
export async function loginWithPasswordOnly(
  password: string
): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  try {
    // First verify the password
    if (password !== ADMIN_PASSWORD) {
      return { success: false, error: 'Invalid admin password' }
    }

    // Find an admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, name, is_admin')
      .eq('is_admin', true)
      .limit(1)
      .maybeSingle()

    if (adminError || !adminUser) {
      return { success: false, error: 'No admin users found. Please set up an admin user first.' }
    }

    // Create session
    const session: AdminSession = {
      userId: adminUser.id,
      name: adminUser.name,
      isAdmin: true,
      expiresAt: Date.now() + SESSION_DURATION,
    }

    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
    }

    return { success: true, session }
  } catch (error) {
    console.error('Admin login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

/**
 * Get current admin session
 */
export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!stored) return null

    const session: AdminSession = JSON.parse(stored)

    // Check if expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(ADMIN_SESSION_KEY)
      return null
    }

    return session
  } catch {
    return null
  }
}

/**
 * Clear admin session (logout)
 */
export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_SESSION_KEY)
  }
}

/**
 * Check if user is admin in database
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return false
    return data.is_admin === true
  } catch {
    return false
  }
}

/**
 * Verify admin session is still valid (checks localStorage + database)
 */
export async function verifyAdminSession(): Promise<{
  valid: boolean
  session: AdminSession | null
}> {
  const session = getAdminSession()
  
  if (!session) {
    return { valid: false, session: null }
  }

  // Verify with database
  const isStillAdmin = await checkIsAdmin(session.userId)
  
  if (!isStillAdmin) {
    logoutAdmin()
    return { valid: false, session: null }
  }

  return { valid: true, session }
}

/**
 * Refresh admin session (extend expiry)
 */
export function refreshAdminSession(): AdminSession | null {
  const session = getAdminSession()
  if (!session) return null

  const newSession: AdminSession = {
    ...session,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(newSession))
  }

  return newSession
}
