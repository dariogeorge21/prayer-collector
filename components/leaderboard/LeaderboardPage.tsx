'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BackgroundLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { supabase } from '@/lib/supabase'
import type { LeaderboardStats } from '@/lib/database.types'
import { 
  ArrowLeft, 
  Trophy, 
  Medal, 
  Flame, 
  Clock, 
  Calendar,
  Loader2,
  Crown,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardPageProps {
  userId: string
}

interface LeaderboardEntry extends LeaderboardStats {
  rank: number
  streak: number
}

export function LeaderboardPage({ userId }: LeaderboardPageProps) {
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [currentUserStats, setCurrentUserStats] = useState<LeaderboardEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch leaderboard stats from the view
      const { data: statsData, error: statsError } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .order('total_score', { ascending: false })

      if (statsError) throw statsError

      // Fetch streak data for each user
      const leaderboardWithStreaks: LeaderboardEntry[] = await Promise.all(
        (statsData || []).map(async (stat, index) => {
          // Calculate streak by counting consecutive days
          const streak = await calculateStreak(stat.user_id)
          return {
            ...stat,
            rank: index + 1,
            streak,
          }
        })
      )

      setLeaderboard(leaderboardWithStreaks)

      // Find current user's rank
      const userEntry = leaderboardWithStreaks.find(e => e.user_id === userId)
      if (userEntry) {
        setCurrentUserRank(userEntry.rank)
        setCurrentUserStats(userEntry)
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // Calculate consecutive day streak for a user
  const calculateStreak = async (targetUserId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('daily_entries')
        .select('entry_date')
        .eq('user_id', targetUserId)
        .order('entry_date', { ascending: false })

      if (error || !data || data.length === 0) return 0

      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < data.length; i++) {
        const entryDate = new Date(data[i].entry_date)
        entryDate.setHours(0, 0, 0, 0)
        
        const expectedDate = new Date(today)
        expectedDate.setDate(today.getDate() - i)
        
        if (entryDate.getTime() === expectedDate.getTime()) {
          streak++
        } else if (i === 0 && entryDate.getTime() === new Date(today.setDate(today.getDate() - 1)).getTime()) {
          // If no entry today but entry yesterday, count from yesterday
          streak++
        } else {
          break
        }
      }

      return streak
    } catch {
      return 0
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  // Format minutes to hours and minutes
  const formatPrayerTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Get rank icon/badge
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-gray-500 font-medium">{rank}</span>
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <BackgroundLayout>
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Loading leaderboard...</p>
        </div>
      </BackgroundLayout>
    )
  }

  return (
    <BackgroundLayout>
      <div className="pb-8">
        {/* Header */}
        <header className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/tracker/${userId}`)}
            className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracker
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Prayer Warriors
            </h1>
            <p className="mt-2 text-gray-600">
              See how you rank among fellow prayer warriors
            </p>
          </div>
        </header>

        {/* Current User Stats Card */}
        {currentUserStats && (
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                    #{currentUserRank}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {currentUserStats.name}
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </h3>
                    <p className="text-sm text-gray-500">Your current ranking</p>
                  </div>
                </div>
                
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{currentUserStats.total_score}</div>
                    <div className="text-xs text-gray-500">Total Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                      {currentUserStats.streak}
                      <Flame className="h-5 w-5" />
                    </div>
                    <div className="text-xs text-gray-500">Day Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-500">{formatPrayerTime(currentUserStats.total_prayer_minutes)}</div>
                    <div className="text-xs text-gray-500">Prayer Time</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-600">
            {error}
            <button onClick={fetchLeaderboard} className="ml-2 underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Leaderboard Table */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Prayer Warriors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No prayer warriors yet.</p>
                <p className="text-sm mt-1">Be the first to log your prayers!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className="hidden sm:inline">Days Active</span>
                        <span className="sm:hidden">Days</span>
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Flame className="h-4 w-4" />
                        <span className="hidden sm:inline">Streak</span>
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="hidden sm:inline">Prayer Time</span>
                        <span className="sm:hidden">Time</span>
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.slice(0, 10).map((entry, index) => {
                    const isCurrentUser = entry.user_id === userId
                    return (
                      <TableRow
                        key={entry.user_id}
                        className={cn(
                          'transition-all duration-300',
                          isCurrentUser && 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary',
                          index === 0 && 'bg-yellow-50/50',
                          index === 1 && 'bg-gray-50/50',
                          index === 2 && 'bg-amber-50/50'
                        )}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getRankBadge(entry.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'font-medium',
                              isCurrentUser && 'text-primary'
                            )}>
                              {entry.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{entry.total_days_logged}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'font-medium flex items-center justify-center gap-1',
                            entry.streak >= 7 && 'text-amber-500'
                          )}>
                            {entry.streak}
                            {entry.streak >= 7 && <Flame className="h-4 w-4" />}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium text-blue-600">
                            {formatPrayerTime(entry.total_prayer_minutes)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg">{entry.total_score}</span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}

            {/* Show more indicator */}
            {leaderboard.length > 10 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Showing top 10 of {leaderboard.length} prayer warriors
              </p>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span>1st Place</span>
          </div>
          <div className="flex items-center gap-1">
            <Medal className="h-4 w-4 text-gray-400" />
            <span>2nd Place</span>
          </div>
          <div className="flex items-center gap-1">
            <Medal className="h-4 w-4 text-amber-600" />
            <span>3rd Place</span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-amber-500" />
            <span>7+ Day Streak</span>
          </div>
        </div>

        {/* Scoring Info */}
        <Card className="mt-6 bg-gray-50/80">
          <CardContent className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">How Scoring Works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-lg">📿</span>
                <span>Rosary: +10 points</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⛪</span>
                <span>Holy Mass: +15 points</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🕐</span>
                <span>Prayer: +1 point/min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BackgroundLayout>
  )
}
