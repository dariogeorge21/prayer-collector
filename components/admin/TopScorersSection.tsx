'use client'

import { useTopScorers, type TopScorer } from '@/hooks/use-top-scorers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Flame,
  Clock,
  CalendarDays,
  Trophy,
  Medal,
  Award,
  RefreshCw,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Format prayer time (minutes to readable format)
const formatPrayerTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

// Get rank badge/icon
const RankBadge = ({ rank }: { rank: number }) => {
  switch (rank) {
    case 1:
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100">
          <Crown className="h-5 w-5 text-yellow-600" />
        </div>
      )
    case 2:
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
          <Medal className="h-5 w-5 text-gray-500" />
        </div>
      )
    case 3:
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
          <Award className="h-5 w-5 text-amber-600" />
        </div>
      )
    default:
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 text-gray-500 font-medium text-sm">
          {rank}
        </div>
      )
  }
}

// Leaderboard card component
interface LeaderboardCardProps {
  title: string
  icon: React.ReactNode
  data: TopScorer[]
  valueFormatter: (value: number) => string
  valueSuffix?: string
  accentColor: string
  isLoading: boolean
}

function LeaderboardCard({
  title,
  icon,
  data,
  valueFormatter,
  valueSuffix,
  accentColor,
  isLoading,
}: LeaderboardCardProps) {
  return (
    <Card className="h-full card-interactive">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No data available yet
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((scorer, index) => (
              <div
                key={scorer.user_id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-all hover:scale-[1.02] animate-fade-in-up",
                  scorer.rank === 1 && "bg-yellow-50/50",
                  scorer.rank === 2 && "bg-gray-50/50",
                  scorer.rank === 3 && "bg-amber-50/50"
                )}
                style={{
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: 'both',
                }}
              >
                <RankBadge rank={scorer.rank} />
                <span className="flex-1 font-medium text-gray-900 truncate">
                  {scorer.name}
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn("font-semibold", accentColor)}
                >
                  {valueFormatter(scorer.value)}
                  {valueSuffix && <span className="ml-0.5 text-xs opacity-70">{valueSuffix}</span>}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TopScorersSection() {
  const { data, isLoading, isValidating, refresh } = useTopScorers()

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Scorers
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={isValidating}
          className="text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isValidating && "animate-spin")} />
          {isValidating ? 'Updating...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Most Consistent */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <LeaderboardCard
            title="Most Consistent"
            icon={<Flame className="h-5 w-5 text-orange-500" />}
            data={data.mostConsistent}
            valueFormatter={(v) => v.toString()}
            valueSuffix="days"
            accentColor="bg-orange-100 text-orange-700"
            isLoading={isLoading}
          />
        </div>

        {/* Most Prayer Time */}
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <LeaderboardCard
            title="Most Prayer Time"
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            data={data.mostPrayerTime}
            valueFormatter={formatPrayerTime}
            accentColor="bg-blue-100 text-blue-700"
            isLoading={isLoading}
          />
        </div>

        {/* Most Active This Week */}
        <div className="animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <LeaderboardCard
            title="Most Active This Week"
            icon={<CalendarDays className="h-5 w-5 text-green-500" />}
            data={data.mostActiveThisWeek}
            valueFormatter={(v) => v.toString()}
            valueSuffix="pts"
            accentColor="bg-green-100 text-green-700"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Crown className="h-3.5 w-3.5 text-yellow-600" />
          <span>1st Place</span>
        </div>
        <div className="flex items-center gap-1">
          <Medal className="h-3.5 w-3.5 text-gray-500" />
          <span>2nd Place</span>
        </div>
        <div className="flex items-center gap-1">
          <Award className="h-3.5 w-3.5 text-amber-600" />
          <span>3rd Place</span>
        </div>
      </div>
    </section>
  )
}
