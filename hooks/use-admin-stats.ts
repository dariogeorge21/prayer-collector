'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase'

export interface AdminStats {
  totalUsers: number
  activeUsersToday: number
  rosariesThisMonth: number
  massesThisMonth: number
  prayerHoursThisMonth: number
  prayerMinutesThisMonth: number
}

// Get first day of current month
const getMonthStart = () => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

// Get today's date
const getToday = () => {
  return new Date().toISOString().split('T')[0]
}

const fetchAdminStats = async (): Promise<AdminStats> => {
  const monthStart = getMonthStart()
  const today = getToday()

  // Run all queries in parallel
  const [
    usersResult,
    activeUsersResult,
    monthlyStatsResult,
  ] = await Promise.all([
    // Total users count
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true }),

    // Active users today (users who have an entry for today)
    supabase
      .from('daily_entries')
      .select('user_id', { count: 'exact', head: true })
      .eq('entry_date', today),

    // Monthly stats aggregation
    supabase
      .from('daily_entries')
      .select('rosary_completed, holy_mass_attended, prayer_time_minutes')
      .gte('entry_date', monthStart)
      .lte('entry_date', today),
  ])

  // Calculate monthly totals
  let rosariesThisMonth = 0
  let massesThisMonth = 0
  let prayerMinutesThisMonth = 0

  if (monthlyStatsResult.data) {
    for (const entry of monthlyStatsResult.data) {
      if (entry.rosary_completed) rosariesThisMonth++
      if (entry.holy_mass_attended) massesThisMonth++
      prayerMinutesThisMonth += entry.prayer_time_minutes || 0
    }
  }

  const prayerHoursThisMonth = Math.floor(prayerMinutesThisMonth / 60)

  return {
    totalUsers: usersResult.count || 0,
    activeUsersToday: activeUsersResult.count || 0,
    rosariesThisMonth,
    massesThisMonth,
    prayerHoursThisMonth,
    prayerMinutesThisMonth,
  }
}

interface UseAdminStatsOptions {
  refreshInterval?: number
}

export function useAdminStats(options: UseAdminStatsOptions = {}) {
  const { refreshInterval = 60 * 1000 } = options // Default: 1 minute

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminStats>(
    'admin-stats',
    fetchAdminStats,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 30 * 1000, // 30 seconds
    }
  )

  return {
    stats: data ?? {
      totalUsers: 0,
      activeUsersToday: 0,
      rosariesThisMonth: 0,
      massesThisMonth: 0,
      prayerHoursThisMonth: 0,
      prayerMinutesThisMonth: 0,
    },
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  }
}
