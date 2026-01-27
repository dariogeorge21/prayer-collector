'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import type { LeaderboardStats } from '@/lib/database.types'

export interface LeaderboardEntry extends LeaderboardStats {
  rank: number
  current_streak: number
}

// Fetcher function for SWR
const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  // Try to use the optimized function first
  const { data: functionData, error: functionError } = await supabase
    .rpc('get_leaderboard_with_streaks')

  if (!functionError && functionData) {
    return functionData as LeaderboardEntry[]
  }

  // Fallback to view + manual streak calculation if function doesn't exist
  console.warn('Falling back to view-based leaderboard query')
  
  const { data: statsData, error: statsError } = await supabase
    .from('leaderboard_stats')
    .select('*')
    .order('total_score', { ascending: false })

  if (statsError) throw statsError

  // Calculate streaks for each user (fallback)
  const leaderboardWithStreaks: LeaderboardEntry[] = await Promise.all(
    (statsData || []).map(async (stat, index) => {
      const streak = await calculateStreakFallback(stat.user_id)
      return {
        ...stat,
        rank: index + 1,
        current_streak: streak,
      }
    })
  )

  return leaderboardWithStreaks
}

// Fallback streak calculation (client-side)
const calculateStreakFallback = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('daily_entries')
      .select('entry_date')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(365)

    if (error || !data || data.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Check if first entry is today or yesterday
    const firstEntryDate = new Date(data[0].entry_date)
    firstEntryDate.setHours(0, 0, 0, 0)

    let expectedDate: Date
    if (firstEntryDate.getTime() === today.getTime()) {
      expectedDate = today
    } else if (firstEntryDate.getTime() === yesterday.getTime()) {
      expectedDate = yesterday
    } else {
      return 0 // No recent activity
    }

    for (const entry of data) {
      const entryDate = new Date(entry.entry_date)
      entryDate.setHours(0, 0, 0, 0)

      if (entryDate.getTime() === expectedDate.getTime()) {
        streak++
        expectedDate = new Date(expectedDate)
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  } catch {
    return 0
  }
}

interface UseLeaderboardOptions {
  userId?: string
  refreshInterval?: number
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[]
  currentUserStats: LeaderboardEntry | null
  currentUserRank: number | null
  isLoading: boolean
  isValidating: boolean
  error: Error | null
  refresh: () => void
}

export function useLeaderboard({
  userId,
  refreshInterval = 5 * 60 * 1000, // 5 minutes default
}: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<LeaderboardEntry[]>(
    'leaderboard', // Cache key
    fetchLeaderboard,
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60 * 1000, // Dedupe requests within 1 minute
      keepPreviousData: true, // Keep showing old data while revalidating
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  const leaderboard = data || []
  
  // Find current user's stats
  const currentUserStats = userId 
    ? leaderboard.find(entry => entry.user_id === userId) || null
    : null
  
  const currentUserRank = currentUserStats?.rank || null

  return {
    leaderboard,
    currentUserStats,
    currentUserRank,
    isLoading,
    isValidating,
    error: error || null,
    refresh: () => mutate(),
  }
}
