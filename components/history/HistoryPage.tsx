'use client'

import { useRouter } from 'next/navigation'
import { useHistory } from '@/hooks/use-history'
import { BackgroundLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Home,
  ArrowLeft,
  Calendar,
  Sparkles,
  Church,
  Clock,
  Flame,
  Trophy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatPrayerTime,
  formatPrayerTimeShort,
  formatDate,
  isCompleteDay,
  type DateRangeFilter,
} from '@/lib/stats-utils'

interface HistoryPageProps {
  userId: string
}

export function HistoryPage({ userId }: HistoryPageProps) {
  const router = useRouter()
  const {
    user,
    entries,
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
  } = useHistory({ userId, pageSize: 10 })

  // Stats cards configuration
  const statCards = [
    {
      title: 'Days Tracked',
      value: stats.totalDays,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Rosaries',
      value: stats.rosaryCount,
      subtitle: `${stats.rosaryPercentage}%`,
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Holy Masses',
      value: stats.massCount,
      subtitle: `${stats.massPercentage}%`,
      icon: Church,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Prayer Time',
      value: Math.floor(stats.totalPrayerMinutes / 60),
      subtitle: 'hours',
      icon: Clock,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
    {
      title: 'Current Streak',
      value: stats.currentStreak,
      subtitle: 'days',
      icon: Flame,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Best Streak',
      value: stats.longestStreak,
      subtitle: 'days',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
  ]

  // Filter options
  const filterOptions: { value: DateRangeFilter; label: string }[] = [
    { value: 'last7', label: 'Last 7 days' },
    { value: 'last30', label: 'Last 30 days' },
    { value: 'last90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ]

  // Loading state
  if (isLoading && !user) {
    return (
      <BackgroundLayout>
        <div className="pb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-9 w-32" />
          </div>
          <Skeleton className="h-12 w-64 mx-auto mb-2" />
          <Skeleton className="h-6 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </BackgroundLayout>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <BackgroundLayout>
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {error?.message === 'User not found' ? 'User Not Found' : 'Error'}
            </h2>
            <p className="mt-2 text-gray-500">
              {error?.message || 'Something went wrong. Please try again.'}
            </p>
            <Button onClick={() => router.push('/')} className="mt-6">
              Back to Home
            </Button>
          </div>
        </div>
      </BackgroundLayout>
    )
  }

  return (
    <BackgroundLayout>
      <div className="pb-8 animate-fade-in-up">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button
            onClick={() => router.push('/')}
            className="hover:text-gray-900 transition-colors"
          >
            <Home className="h-4 w-4" />
          </button>
          <span>/</span>
          <button
            onClick={() => router.push(`/tracker/${userId}`)}
            className="hover:text-gray-900 transition-colors"
          >
            Tracker
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">History</span>
        </nav>

        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <History className="h-8 w-8 text-primary animate-pulse-soft" />
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              My Prayer History
            </h1>
          </div>
          <p className="text-gray-600">
            <span className="font-medium">{user.name}</span>&apos;s spiritual journey
          </p>
        </header>

        {/* Stats Cards */}
        <section className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <Card
                key={stat.title}
                className={cn(
                  'relative overflow-hidden transition-all hover:shadow-md card-interactive animate-fade-in-up',
                  stat.borderColor,
                  'border-l-4'
                )}
                style={{
                  animationDelay: `${index * 80}ms`,
                  animationFillMode: 'both',
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <p className={cn('text-2xl sm:text-3xl font-bold', stat.color)}>
                          {stat.value.toLocaleString()}
                        </p>
                        {stat.subtitle && (
                          <span className="text-xs sm:text-sm text-gray-400">
                            {stat.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn('p-2 sm:p-3 rounded-full', stat.bgColor)}>
                      <stat.icon className={cn('h-5 w-5 sm:h-6 sm:w-6', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* History Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Daily Entries
                <Badge variant="secondary" className="ml-2">
                  {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                </Badge>
              </CardTitle>

              <div className="flex items-center gap-2">
                <Select
                  value={dateFilter}
                  onValueChange={(value) => setDateFilter(value as DateRangeFilter)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refresh}
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isLoading && 'animate-spin')}
                  />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Rosary</TableHead>
                    <TableHead className="text-center">Holy Mass</TableHead>
                    <TableHead className="text-center">Prayer Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-5 w-6 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-5 w-6 mx-auto" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-5 w-12 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : entries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-12 text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Calendar className="h-12 w-12 text-gray-300" />
                          <div>
                            <p className="font-medium">No prayer history yet</p>
                            <p className="text-sm">
                              Start tracking today to see your progress!
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/tracker/${userId}`)}
                            className="mt-2"
                          >
                            Go to Tracker
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    entries.map((entry) => {
                      const complete = isCompleteDay(entry)
                      return (
                        <TableRow
                          key={entry.id}
                          className={cn(
                            'hover:bg-gray-50 transition-colors',
                            complete && 'bg-green-50/50 hover:bg-green-50'
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {formatDate(entry.entry_date)}
                              </span>
                              {complete && (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 text-xs"
                                >
                                  Complete
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.rosary_completed ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.holy_mass_attended ? (
                              <Check className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span
                                className={cn(
                                  'font-medium',
                                  entry.prayer_time_minutes > 0
                                    ? 'text-blue-600'
                                    : 'text-gray-400'
                                )}
                              >
                                {entry.prayer_time_minutes > 0
                                  ? formatPrayerTimeShort(entry.prayer_time_minutes)
                                  : '0m'}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          disabled={isLoading}
                          className="w-8"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Tracker Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push(`/tracker/${userId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tracker
          </Button>
        </div>
      </div>
    </BackgroundLayout>
  )
}
