'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { DailyEntry, User } from '@/lib/database.types'
import {
  calculateStreak,
  calculateLongestStreak,
  calculateTotalStats,
  getDateRange,
  type DateRangeFilter,
  type StatsObject,
} from '@/lib/stats-utils'

export interface HistoryStats extends StatsObject {
  currentStreak: number
  longestStreak: number
}

interface UseHistoryOptions {
  userId: string
  pageSize?: number
  initialFilter?: DateRangeFilter
}

interface UseHistoryReturn {
  user: User | null
  entries: DailyEntry[]
  allEntries: DailyEntry[] // All entries for stats calculation
  stats: HistoryStats
  totalCount: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: Error | null
  dateFilter: DateRangeFilter
  setPage: (page: number) => void
  setDateFilter: (filter: DateRangeFilter) => void
  refresh: () => void
}

const defaultStats: HistoryStats = {
  totalDays: 0,
  rosaryCount: 0,
  massCount: 0,
  totalPrayerMinutes: 0,
  rosaryPercentage: 0,
  massPercentage: 0,
  completeDays: 0,
  completePercentage: 0,
  currentStreak: 0,
  longestStreak: 0,
}

export function useHistory(options: UseHistoryOptions): UseHistoryReturn {
  const { userId, pageSize = 10, initialFilter = 'last30' } = options

  const [user, setUser] = useState<User | null>(null)
  const [entries, setEntries] = useState<DailyEntry[]>([])
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([])
  const [stats, setStats] = useState<HistoryStats>(defaultStats)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>(initialFilter)

  const totalPages = Math.ceil(totalCount / pageSize)

  // Fetch user data
  const fetchUser = useCallback(async () => {
    try {
      const { data, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error('User not found')
        }
        throw userError
      }

      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user'))
      throw err
    }
  }, [userId])

  // Fetch all entries for stats calculation
  const fetchAllEntries = useCallback(async () => {
    try {
      const { data, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })

      if (entriesError) throw entriesError

      setAllEntries(data || [])

      // Calculate stats from all entries
      const baseStats = calculateTotalStats(data || [])
      const currentStreak = calculateStreak(data || [])
      const longestStreak = calculateLongestStreak(data || [])

      setStats({
        ...baseStats,
        currentStreak,
        longestStreak,
      })
    } catch (err) {
      console.error('Error fetching all entries:', err)
    }
  }, [userId])

  // Fetch paginated entries with date filter
  const fetchEntries = useCallback(async () => {
    try {
      const { start, end } = getDateRange(dateFilter)
      const startStr = start.toISOString().split('T')[0]
      const endStr = end.toISOString().split('T')[0]

      // Get count
      let countQuery = supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (dateFilter !== 'all') {
        countQuery = countQuery.gte('entry_date', startStr).lte('entry_date', endStr)
      }

      const { count, error: countError } = await countQuery

      if (countError) throw countError

      setTotalCount(count || 0)

      // Get paginated data
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      let dataQuery = supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .range(from, to)

      if (dateFilter !== 'all') {
        dataQuery = dataQuery.gte('entry_date', startStr).lte('entry_date', endStr)
      }

      const { data, error: dataError } = await dataQuery

      if (dataError) throw dataError

      setEntries(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch entries'))
    }
  }, [userId, dateFilter, currentPage, pageSize])

  // Combined fetch function
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      await fetchUser()
      await Promise.all([fetchAllEntries(), fetchEntries()])
    } catch {
      // Errors already set in individual functions
    } finally {
      setIsLoading(false)
    }
  }, [fetchUser, fetchAllEntries, fetchEntries])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch when page or filter changes
  useEffect(() => {
    if (!isLoading) {
      fetchEntries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, dateFilter])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [dateFilter])

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    user,
    entries,
    allEntries,
    stats,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    dateFilter,
    setPage,
    setDateFilter,
    refresh,
  }
}
