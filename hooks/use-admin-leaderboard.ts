'use client'

import useSWR from 'swr'
import { supabase } from '@/lib/supabase'

export interface AdminLeaderboardEntry {
  user_id: string
  name: string
  total_score: number
  rosary_days: number
  mass_days: number
  total_prayer_minutes: number
  total_days_logged: number
  leaderboard_excluded: boolean
  /** Rank counting only non-excluded users. null when this user is excluded. */
  active_rank: number | null
  /** Global rank across all users regardless of exclusion. */
  overall_rank: number
}

const fetchAdminLeaderboard = async (): Promise<AdminLeaderboardEntry[]> => {
  // 1. Fetch leaderboard stats ordered by score
  const { data: statsData, error: statsError } = await supabase
    .from('leaderboard_stats')
    .select('*')
    .order('total_score', { ascending: false })

  if (statsError) throw statsError

  // 2. Fetch users with exclusion flag
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, leaderboard_excluded')

  if (usersError) throw usersError

  const usersMap = new Map(
    (usersData ?? []).map((u) => [u.id, u.leaderboard_excluded ?? false])
  )

  // 3. Merge and compute active ranks
  let activeRank = 1
  return (statsData ?? []).map((stat, index) => {
    const excluded = usersMap.get(stat.user_id) ?? false
    const entry: AdminLeaderboardEntry = {
      user_id: stat.user_id,
      name: stat.name,
      total_score: stat.total_score,
      rosary_days: stat.rosary_days,
      mass_days: stat.mass_days,
      total_prayer_minutes: stat.total_prayer_minutes,
      total_days_logged: stat.total_days_logged,
      leaderboard_excluded: excluded,
      overall_rank: index + 1,
      active_rank: excluded ? null : activeRank,
    }
    if (!excluded) activeRank++
    return entry
  })
}

/** Recompute active_rank for a list after a toggle (pure helper). */
function recomputeActiveRanks(
  list: AdminLeaderboardEntry[]
): AdminLeaderboardEntry[] {
  let activeRank = 1
  return list.map((entry) => {
    const active_rank = entry.leaderboard_excluded ? null : activeRank
    if (!entry.leaderboard_excluded) activeRank++
    return { ...entry, active_rank }
  })
}

export function useAdminLeaderboard() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<
    AdminLeaderboardEntry[]
  >('admin-leaderboard', fetchAdminLeaderboard, {
    revalidateOnFocus: true,
    dedupingInterval: 30_000,
  })

  const toggleExclusion = async (userId: string, excluded: boolean) => {
    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current
        const updated = current.map((e) =>
          e.user_id === userId ? { ...e, leaderboard_excluded: excluded } : e
        )
        return recomputeActiveRanks(updated)
      },
      { revalidate: false }
    )

    // Persist to database via SECURITY DEFINER RPC
    const { error: rpcError } = await supabase.rpc(
      'toggle_leaderboard_exclusion',
      { p_user_id: userId, p_excluded: excluded }
    )

    // Always revalidate to stay in sync
    mutate()

    if (rpcError) throw rpcError
  }

  return {
    leaderboard: data ?? [],
    isLoading,
    isValidating,
    error: error ?? null,
    refresh: () => mutate(),
    toggleExclusion,
  }
}
