'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserWithStats {
  id: string
  name: string
  email: string | null
  is_admin: boolean
  created_at: string
  total_entries: number
  last_active_date: string | null
  total_rosaries: number
  total_masses: number
  total_prayer_minutes: number
  current_streak: number
}

export type SortField = 'name' | 'total_entries' | 'last_active_date' | 'total_rosaries' | 'total_masses' | 'total_prayer_minutes' | 'current_streak'
export type SortDirection = 'asc' | 'desc'

interface UseUserStatsOptions {
  pageSize?: number
  initialSortField?: SortField
  initialSortDirection?: SortDirection
}

interface UseUserStatsReturn {
  users: UserWithStats[]
  totalCount: number
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: Error | null
  sortField: SortField
  sortDirection: SortDirection
  searchQuery: string
  setPage: (page: number) => void
  setSort: (field: SortField) => void
  setSearchQuery: (query: string) => void
  refresh: () => void
  exportToCSV: () => void
}

// Calculate streak for a user
const calculateStreak = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('daily_entries')
      .select('entry_date')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(30)

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

export function useUserStats(options: UseUserStatsOptions = {}): UseUserStatsReturn {
  const {
    pageSize = 10,
    initialSortField = 'name',
    initialSortDirection = 'asc',
  } = options

  const [users, setUsers] = useState<UserWithStats[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [sortField, setSortField] = useState<SortField>(initialSortField)
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection)
  const [searchQuery, setSearchQuery] = useState('')

  const totalPages = Math.ceil(totalCount / pageSize)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build query for users with search
      let countQuery = supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      let dataQuery = supabase
        .from('users')
        .select('*')

      // Apply search filter
      if (searchQuery.trim()) {
        const searchPattern = `%${searchQuery.trim()}%`
        countQuery = countQuery.ilike('name', searchPattern)
        dataQuery = dataQuery.ilike('name', searchPattern)
      }

      // Get total count
      const { count, error: countError } = await countQuery
      if (countError) throw countError
      setTotalCount(count || 0)

      // Apply sorting for name field only (other fields need post-processing)
      if (sortField === 'name') {
        dataQuery = dataQuery.order('name', { ascending: sortDirection === 'asc' })
      } else {
        dataQuery = dataQuery.order('name', { ascending: true })
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      dataQuery = dataQuery.range(from, to)

      const { data: usersData, error: usersError } = await dataQuery
      if (usersError) throw usersError

      // Fetch stats for each user
      const usersWithStats: UserWithStats[] = await Promise.all(
        (usersData || []).map(async (user) => {
          // Get user stats from leaderboard_stats view
          const { data: statsData } = await supabase
            .from('leaderboard_stats')
            .select('*')
            .eq('user_id', user.id)
            .single()

          // Get last active date
          const { data: lastEntry } = await supabase
            .from('daily_entries')
            .select('entry_date')
            .eq('user_id', user.id)
            .order('entry_date', { ascending: false })
            .limit(1)
            .single()

          // Calculate streak
          const streak = await calculateStreak(user.id)

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            is_admin: user.is_admin,
            created_at: user.created_at,
            total_entries: statsData?.total_days_logged || 0,
            last_active_date: lastEntry?.entry_date || null,
            total_rosaries: statsData?.rosary_days || 0,
            total_masses: statsData?.mass_days || 0,
            total_prayer_minutes: statsData?.total_prayer_minutes || 0,
            current_streak: streak,
          }
        })
      )

      // Sort by non-name fields if needed
      if (sortField !== 'name') {
        usersWithStats.sort((a, b) => {
          let aVal: string | number = a[sortField] ?? ''
          let bVal: string | number = b[sortField] ?? ''

          // Handle null dates - sort nulls to the end
          if (sortField === 'last_active_date') {
            if (!a[sortField] && !b[sortField]) return 0
            if (!a[sortField]) return sortDirection === 'asc' ? 1 : -1
            if (!b[sortField]) return sortDirection === 'asc' ? -1 : 1
          }

          if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
          if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
          return 0
        })
      }

      setUsers(usersWithStats)
    } catch (err) {
      console.error('Error fetching user stats:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch users'))
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, sortField, sortDirection, searchQuery])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)))
  }, [totalPages])

  const setSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const exportToCSV = useCallback(() => {
    if (users.length === 0) return

    const headers = [
      'Name',
      'Email',
      'Admin',
      'Total Entries',
      'Last Active',
      'Total Rosaries',
      'Total Masses',
      'Prayer Minutes',
      'Current Streak',
    ]

    const rows = users.map(user => [
      user.name,
      user.email || '',
      user.is_admin ? 'Yes' : 'No',
      user.total_entries,
      user.last_active_date || 'Never',
      user.total_rosaries,
      user.total_masses,
      user.total_prayer_minutes,
      user.current_streak,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `faith-tracker-users-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [users])

  return {
    users,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    sortField,
    sortDirection,
    searchQuery,
    setPage,
    setSort,
    setSearchQuery,
    refresh: fetchUsers,
    exportToCSV,
  }
}
