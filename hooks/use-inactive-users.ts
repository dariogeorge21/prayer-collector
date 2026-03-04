'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase'

export interface InactiveUser {
  id: string
  name: string
  created_at: string
}

const getToday = () => new Date().toISOString().split('T')[0]

const fetchInactiveUsers = async (): Promise<InactiveUser[]> => {
  const today = getToday()

  // Get user_ids that have an entry for today
  const { data: activeEntries, error: entriesError } = await supabase
    .from('daily_entries')
    .select('user_id')
    .eq('entry_date', today)

  if (entriesError) throw entriesError

  const activeUserIds = (activeEntries ?? []).map((e) => e.user_id)

  // Fetch all users not in the active list
  let query = supabase
    .from('users')
    .select('id, name, created_at')
    .order('name', { ascending: true })

  if (activeUserIds.length > 0) {
    query = query.not('id', 'in', `(${activeUserIds.join(',')})`)
  }

  const { data: users, error: usersError } = await query
  if (usersError) throw usersError

  return users ?? []
}

interface UseInactiveUsersOptions {
  refreshInterval?: number
}

export function useInactiveUsers(options: UseInactiveUsersOptions = {}) {
  const { refreshInterval = 60 * 1000 } = options

  const { data, error, isLoading, isValidating, mutate } = useSWR<InactiveUser[]>(
    'admin-inactive-users',
    fetchInactiveUsers,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 30 * 1000,
    }
  )

  return {
    users: data ?? [],
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  }
}
