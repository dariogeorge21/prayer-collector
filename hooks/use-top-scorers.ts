'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase'

export interface TopScorer {
  user_id: string
  name: string
  value: number
  rank: number
}

export interface TopScorersData {
  mostConsistent: TopScorer[]
  mostPrayerTime: TopScorer[]
  mostActiveThisWeek: TopScorer[]
}

// Get start of current week (Monday)
const getWeekStart = () => {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

// Calculate streak for a user
const calculateStreak = async (userId: string): Promise<number> => {
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

    const firstEntryDate = new Date(data[0].entry_date)
    firstEntryDate.setHours(0, 0, 0, 0)

    let expectedDate: Date
    if (firstEntryDate.getTime() === today.getTime()) {
      expectedDate = today
    } else if (firstEntryDate.getTime() === yesterday.getTime()) {
      expectedDate = yesterday
    } else {
      return 0
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

const fetchTopScorers = async (): Promise<TopScorersData> => {
  const weekStart = getWeekStart()
  const today = new Date().toISOString().split('T')[0]

  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name')

  if (usersError || !users) {
    throw usersError || new Error('Failed to fetch users')
  }

  // Calculate streaks for all users
  const usersWithStreaks = await Promise.all(
    users.map(async (user) => ({
      user_id: user.id,
      name: user.name,
      streak: await calculateStreak(user.id),
    }))
  )

  // Most Consistent (highest streak)
  const mostConsistent: TopScorer[] = usersWithStreaks
    .filter(u => u.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)
    .map((u, index) => ({
      user_id: u.user_id,
      name: u.name,
      value: u.streak,
      rank: index + 1,
    }))

  // Most Prayer Time (from leaderboard_stats view)
  const { data: prayerTimeData } = await supabase
    .from('leaderboard_stats')
    .select('user_id, name, total_prayer_minutes')
    .order('total_prayer_minutes', { ascending: false })
    .limit(5)

  const mostPrayerTime: TopScorer[] = (prayerTimeData || []).map((u, index) => ({
    user_id: u.user_id,
    name: u.name,
    value: u.total_prayer_minutes,
    rank: index + 1,
  }))

  // Most Active This Week
  const { data: weeklyData } = await supabase
    .from('daily_entries')
    .select('user_id, prayer_time_minutes, rosary_completed, holy_mass_attended')
    .gte('entry_date', weekStart)
    .lte('entry_date', today)

  // Aggregate weekly activity by user
  const weeklyActivity: Record<string, { userId: string; entries: number; score: number }> = {}
  
  for (const entry of weeklyData || []) {
    if (!weeklyActivity[entry.user_id]) {
      weeklyActivity[entry.user_id] = { userId: entry.user_id, entries: 0, score: 0 }
    }
    weeklyActivity[entry.user_id].entries++
    weeklyActivity[entry.user_id].score += 
      (entry.rosary_completed ? 10 : 0) + 
      (entry.holy_mass_attended ? 15 : 0) + 
      (entry.prayer_time_minutes || 0)
  }

  // Get user names and sort by score
  const weeklyScores = Object.values(weeklyActivity)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const mostActiveThisWeek: TopScorer[] = await Promise.all(
    weeklyScores.map(async (activity, index) => {
      const user = users.find(u => u.id === activity.userId)
      return {
        user_id: activity.userId,
        name: user?.name || 'Unknown',
        value: activity.score,
        rank: index + 1,
      }
    })
  )

  return {
    mostConsistent,
    mostPrayerTime,
    mostActiveThisWeek,
  }
}

interface UseTopScorersOptions {
  refreshInterval?: number
}

export function useTopScorers(options: UseTopScorersOptions = {}) {
  const { refreshInterval = 2 * 60 * 1000 } = options // Default: 2 minutes

  const { data, error, isLoading, isValidating, mutate } = useSWR<TopScorersData>(
    'top-scorers',
    fetchTopScorers,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 30 * 1000,
    }
  )

  return {
    data: data ?? {
      mostConsistent: [],
      mostPrayerTime: [],
      mostActiveThisWeek: [],
    },
    isLoading,
    isValidating,
    error,
    refresh: () => mutate(),
  }
}
