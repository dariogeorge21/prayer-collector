'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase'
import {
  processContributions,
  type ContributionData,
} from '@/lib/contribution-utils'

async function fetchContributions(userId: string): Promise<ContributionData> {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 365)
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('daily_entries')
    .select('entry_date, rosary_completed, holy_mass_attended, prayer_time_minutes')
    .eq('user_id', userId)
    .gte('entry_date', startStr)
    .order('entry_date', { ascending: true })

  if (error) throw error

  return processContributions(data ?? [])
}

interface UseUserContributionsOptions {
  userId: string
  /** Only fetch when true (lazy loading) */
  enabled?: boolean
}

interface UseUserContributionsReturn {
  data: ContributionData | undefined
  isLoading: boolean
  error: Error | null
}

/**
 * Lazy-fetch 365 days of contribution data for a single user.
 * Set `enabled: false` to defer fetching until the user expands the heatmap.
 */
export function useUserContributions({
  userId,
  enabled = true,
}: UseUserContributionsOptions): UseUserContributionsReturn {
  const { data, error, isLoading } = useSWR<ContributionData>(
    enabled ? ['contributions', userId] : null,
    () => fetchContributions(userId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000, // 5 min dedup
      keepPreviousData: true,
    },
  )

  return { data, isLoading, error: error ?? null }
}
