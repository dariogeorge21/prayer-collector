'use client'

import { useState } from 'react'
import { useAdminLeaderboard, type AdminLeaderboardEntry } from '@/hooks/use-admin-leaderboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import {
  Crown,
  Medal,
  Award,
  EyeOff,
  Eye,
  RefreshCw,
  Trophy,
  Sparkles,
  Church,
  Clock,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatScore = (score: number) => score.toLocaleString()

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─────────────────────────────────────────────
// Podium step config
// ─────────────────────────────────────────────

interface PodiumStep {
  rank: 1 | 2 | 3
  heightClass: string
  bgGradient: string
  borderColor: string
  ringColor: string
  iconColor: string
  textColor: string
  subtleText: string
  label: string
  Icon: React.ElementType
  badgeBg: string
}

const PODIUM_CONFIG: PodiumStep[] = [
  {
    rank: 2,
    heightClass: 'h-20',
    bgGradient: 'bg-gradient-to-b from-gray-100 to-gray-200',
    borderColor: 'border-gray-300',
    ringColor: 'ring-gray-300',
    iconColor: 'text-gray-500',
    textColor: 'text-gray-700',
    subtleText: 'text-gray-500',
    label: '2nd',
    Icon: Medal,
    badgeBg: 'bg-gray-200 text-gray-700',
  },
  {
    rank: 1,
    heightClass: 'h-28',
    bgGradient: 'bg-gradient-to-b from-yellow-300 to-yellow-500',
    borderColor: 'border-yellow-400',
    ringColor: 'ring-yellow-400',
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-900',
    subtleText: 'text-yellow-700',
    label: '1st',
    Icon: Crown,
    badgeBg: 'bg-yellow-100 text-yellow-800',
  },
  {
    rank: 3,
    heightClass: 'h-14',
    bgGradient: 'bg-gradient-to-b from-amber-400 to-amber-600',
    borderColor: 'border-amber-500',
    ringColor: 'ring-amber-400',
    iconColor: 'text-amber-700',
    textColor: 'text-amber-900',
    subtleText: 'text-amber-700',
    label: '3rd',
    Icon: Award,
    badgeBg: 'bg-amber-100 text-amber-800',
  },
]

// ─────────────────────────────────────────────
// PodiumCard – one step of the podium
// ─────────────────────────────────────────────

function PodiumCard({
  config,
  entry,
}: {
  config: PodiumStep
  entry: AdminLeaderboardEntry | undefined
}) {
  const { heightClass, bgGradient, borderColor, ringColor, iconColor, textColor, subtleText, label, Icon, badgeBg } = config

  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      {/* User info above the step */}
      <div className="flex flex-col items-center gap-1 text-center px-1 min-w-0 w-full">
        {entry ? (
          <>
            {/* Avatar circle */}
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ring-2',
                borderColor,
                ringColor,
                config.rank === 1
                  ? 'bg-yellow-50 text-yellow-700'
                  : config.rank === 2
                  ? 'bg-gray-50 text-gray-600'
                  : 'bg-amber-50 text-amber-700'
              )}
            >
              {entry.name.charAt(0).toUpperCase()}
            </div>
            <p className={cn('font-semibold text-sm leading-tight truncate max-w-full', textColor)}>
              {entry.name}
            </p>
            <span className={cn('text-xs font-medium', subtleText)}>
              {formatScore(entry.total_score)} pts
            </span>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-xs">—</span>
            </div>
            <p className="text-sm text-gray-400 font-medium">Empty</p>
          </>
        )}
      </div>

      {/* The podium step itself */}
      <div
        className={cn(
          'w-full rounded-t-lg border-t-2 border-x-2 flex flex-col items-center justify-center gap-1',
          heightClass,
          bgGradient,
          borderColor
        )}
      >
        <Icon className={cn('h-5 w-5', config.rank === 1 ? 'text-yellow-800' : config.rank === 2 ? 'text-gray-600' : 'text-amber-800')} />
        <span
          className={cn(
            'text-sm font-bold',
            config.rank === 1 ? 'text-yellow-900' : config.rank === 2 ? 'text-gray-700' : 'text-amber-900'
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Ranked list row
// ─────────────────────────────────────────────

function RankedRow({
  entry,
  onToggle,
  isToggling,
}: {
  entry: AdminLeaderboardEntry
  onToggle: (userId: string, excluded: boolean) => void
  isToggling: boolean
}) {
  const { leaderboard_excluded, active_rank, name, total_score, rosary_days, mass_days, total_prayer_minutes } = entry

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-all',
        leaderboard_excluded
          ? 'bg-gray-50 opacity-60'
          : active_rank === 1
          ? 'bg-yellow-50 border border-yellow-200'
          : active_rank === 2
          ? 'bg-gray-50 border border-gray-200'
          : active_rank === 3
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-white border border-gray-100 hover:bg-gray-50'
      )}
    >
      {/* Rank badge */}
      <div className="flex-shrink-0 w-8 text-center">
        {leaderboard_excluded ? (
          <span className="text-xs text-gray-400 font-medium">—</span>
        ) : active_rank === 1 ? (
          <Crown className="h-5 w-5 text-yellow-500 mx-auto" />
        ) : active_rank === 2 ? (
          <Medal className="h-5 w-5 text-gray-400 mx-auto" />
        ) : active_rank === 3 ? (
          <Award className="h-5 w-5 text-amber-500 mx-auto" />
        ) : (
          <span className="text-sm text-gray-500 font-semibold">{active_rank}</span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'font-medium text-sm truncate',
              leaderboard_excluded ? 'line-through text-gray-400' : 'text-gray-900'
            )}
          >
            {name}
          </span>
          {leaderboard_excluded && (
            <Badge variant="secondary" className="text-xs bg-red-100 text-red-600 border-red-200 flex-shrink-0">
              Excluded
            </Badge>
          )}
        </div>
        {/* Mini stats */}
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
          <span className="flex items-center gap-0.5">
            <Sparkles className="h-3 w-3" />
            {rosary_days}
          </span>
          <span className="flex items-center gap-0.5">
            <Church className="h-3 w-3" />
            {mass_days}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatTime(total_prayer_minutes)}
          </span>
        </div>
      </div>

      {/* Score */}
      <span className={cn('text-sm font-semibold flex-shrink-0', leaderboard_excluded ? 'text-gray-400' : 'text-gray-700')}>
        {formatScore(total_score)} pts
      </span>

      {/* Exclude / Include toggle */}
      <Button
        variant="ghost"
        size="sm"
        disabled={isToggling}
        onClick={() => onToggle(entry.user_id, !leaderboard_excluded)}
        className={cn(
          'flex-shrink-0 h-8 px-2 text-xs gap-1',
          leaderboard_excluded
            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
            : 'text-red-500 hover:text-red-600 hover:bg-red-50'
        )}
        title={leaderboard_excluded ? 'Include on leaderboard' : 'Exclude from leaderboard'}
      >
        {leaderboard_excluded ? (
          <>
            <Eye className="h-3.5 w-3.5" />
            Include
          </>
        ) : (
          <>
            <EyeOff className="h-3.5 w-3.5" />
            Exclude
          </>
        )}
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────

export function AdminLeaderboardPodium() {
  const { leaderboard, isLoading, isValidating, refresh, toggleExclusion } =
    useAdminLeaderboard()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (userId: string, excluded: boolean) => {
    setTogglingId(userId)
    try {
      await toggleExclusion(userId, excluded)
      toast({
        title: excluded ? 'User excluded' : 'User included',
        description: excluded
          ? 'This user will no longer appear on the leaderboard.'
          : 'This user will now appear on the leaderboard.',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update leaderboard exclusion. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setTogglingId(null)
    }
  }

  // Top 3 non-excluded entries (for the podium)
  const podiumEntries = leaderboard.filter((e) => !e.leaderboard_excluded)
  const top3 = podiumEntries.slice(0, 3)

  // Podium display order: 2nd | 1st | 3rd
  const podiumSlots: { config: PodiumStep; entry: AdminLeaderboardEntry | undefined }[] = [
    { config: PODIUM_CONFIG[0], entry: top3[1] }, // 2nd place
    { config: PODIUM_CONFIG[1], entry: top3[0] }, // 1st place
    { config: PODIUM_CONFIG[2], entry: top3[2] }, // 3rd place
  ]

  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard Podium
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isValidating}
          className="text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isValidating && 'animate-spin')} />
          {isValidating ? 'Updating…' : 'Refresh'}
        </Button>
      </div>

      <Card className="overflow-hidden">
        {/* ── Podium ── */}
        <div className="bg-gradient-to-b from-indigo-50 via-purple-50 to-white px-6 pt-6 pb-0">
          {isLoading ? (
            <div className="flex items-end justify-center gap-4 h-56">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className={cn('w-full rounded-t-lg', i === 1 ? 'h-28' : i === 0 ? 'h-20' : 'h-14')} />
                </div>
              ))}
            </div>
          ) : podiumEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Star className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No data yet — start tracking prayers!</p>
            </div>
          ) : (
            <div className="flex items-end justify-center gap-3">
              {podiumSlots.map(({ config, entry }) => (
                <PodiumCard key={config.rank} config={config} entry={entry} />
              ))}
            </div>
          )}
        </div>

        {/* ── Divider + legend ── */}
        <div className="flex items-center justify-center gap-6 py-3 border-b border-gray-100 bg-white text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Crown className="h-3.5 w-3.5 text-yellow-500" /> 1st
          </span>
          <span className="flex items-center gap-1">
            <Medal className="h-3.5 w-3.5 text-gray-400" /> 2nd
          </span>
          <span className="flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-amber-500" /> 3rd
          </span>
          <span className="flex items-center gap-1 ml-4 text-gray-300">|</span>
          <span className="flex items-center gap-1 text-gray-400">
            <EyeOff className="h-3 w-3" /> = excluded from public view
          </span>
        </div>

        {/* ── Full ranked list ── */}
        <CardContent className="pt-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {/* Active users first */}
              {leaderboard
                .filter((e) => !e.leaderboard_excluded)
                .map((entry) => (
                  <RankedRow
                    key={entry.user_id}
                    entry={entry}
                    onToggle={handleToggle}
                    isToggling={togglingId === entry.user_id}
                  />
                ))}

              {/* Excluded section */}
              {leaderboard.some((e) => e.leaderboard_excluded) && (
                <>
                  <div className="flex items-center gap-2 pt-3 pb-1">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Excluded from leaderboard
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  {leaderboard
                    .filter((e) => e.leaderboard_excluded)
                    .map((entry) => (
                      <RankedRow
                        key={entry.user_id}
                        entry={entry}
                        onToggle={handleToggle}
                        isToggling={togglingId === entry.user_id}
                      />
                    ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
