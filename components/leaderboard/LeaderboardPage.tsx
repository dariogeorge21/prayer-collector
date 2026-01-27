'use client'

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
import { useLeaderboard } from '@/hooks/use-leaderboard'
import { 
  ArrowLeft, 
  Trophy, 
  Medal, 
  Flame, 
  Clock, 
  Calendar,
  Loader2,
  Crown,
  Star,
  RefreshCw,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardPageProps {
  userId: string
}

export function LeaderboardPage({ userId }: LeaderboardPageProps) {
  const router = useRouter()
  const {
    leaderboard,
    currentUserStats,
    currentUserRank,
    isLoading,
    isValidating,
    error,
    refresh,
  } = useLeaderboard({ userId, refreshInterval: 5 * 60 * 1000 }) // 5 minutes cache

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

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center space-y-2">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 flex-1 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Users className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">No Prayer Warriors Yet</h3>
      <p className="mt-2 text-gray-500 max-w-sm mx-auto">
        Be the first to start your spiritual journey! Head back to the tracker and log your first prayer.
      </p>
      <Button onClick={() => router.push(`/tracker/${userId}`)} className="mt-6">
        Start Tracking
      </Button>
    </div>
  )

  return (
    <BackgroundLayout>
      <div className="pb-8 animate-fade-in-up">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/tracker/${userId}`)}
              className="-ml-2 text-gray-600 hover:text-gray-900 btn-bounce"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tracker
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isValidating}
              className="text-gray-600 hover:text-gray-900 btn-bounce"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isValidating && "animate-spin")} />
              {isValidating ? 'Updating...' : 'Refresh'}
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl flex items-center justify-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500 animate-bounce-subtle" />
              Prayer Warriors
            </h1>
            <p className="mt-2 text-gray-600">
              See how you rank among fellow prayer warriors
            </p>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">Failed to load leaderboard. Please try again.</p>
              <Button onClick={refresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <>
            {/* Current User Stats Card */}
            {currentUserStats && (
              <Card className="mb-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20 card-interactive animate-scale-in">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary transition-transform duration-300 hover:scale-110">
                        #{currentUserRank}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {currentUserStats.name}
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-pulse-soft" />
                        </h3>
                        <p className="text-sm text-gray-500">Your current ranking</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-6 text-center">
                      <div className="transition-transform duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-primary">{currentUserStats.total_score}</div>
                        <div className="text-xs text-gray-500">Total Points</div>
                      </div>
                      <div className="transition-transform duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-amber-500 flex items-center justify-center gap-1">
                          {currentUserStats.current_streak}
                          <Flame className="h-5 w-5" />
                        </div>
                        <div className="text-xs text-gray-500">Day Streak</div>
                      </div>
                      <div className="transition-transform duration-300 hover:scale-105">
                        <div className="text-2xl font-bold text-blue-500">{formatPrayerTime(currentUserStats.total_prayer_minutes)}</div>
                        <div className="text-xs text-gray-500">Prayer Time</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard Table */}
            <Card className="bg-white/90 backdrop-blur-sm card-interactive">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Prayer Warriors
                </CardTitle>
                {isValidating && !isLoading && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating...
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <EmptyState />
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
                              'transition-all duration-300 animate-fade-in-up hover:scale-[1.01]',
                              isCurrentUser && 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary rank-highlight-animation',
                              !isCurrentUser && index === 0 && 'bg-yellow-50/50',
                              !isCurrentUser && index === 1 && 'bg-gray-50/50',
                              !isCurrentUser && index === 2 && 'bg-amber-50/50'
                            )}
                            style={{
                              animationDelay: `${index * 80}ms`,
                              animationFillMode: 'both',
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
                                entry.current_streak >= 7 && 'text-amber-500'
                              )}>
                                {entry.current_streak}
                                {entry.current_streak >= 7 && <Flame className="h-4 w-4" />}
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
            {leaderboard.length > 0 && (
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
            )}

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

            {/* Cache info */}
            <p className="mt-4 text-center text-xs text-gray-400">
              Data refreshes automatically every 5 minutes
            </p>
          </>
        )}
      </div>
    </BackgroundLayout>
  )
}
