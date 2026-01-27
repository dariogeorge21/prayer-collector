'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
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
  Shield,
  Download,
  User,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatPrayerTime,
  formatPrayerTimeShort,
  formatDate,
  isCompleteDay,
  getActivityStatus,
  type DateRangeFilter,
} from '@/lib/stats-utils'

interface AdminUserDetailPageProps {
  userId: string
}

export function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  return (
    <ProtectedRoute>
      <AdminUserDetailContent userId={userId} />
    </ProtectedRoute>
  )
}

type CompletionFilter = 'all' | 'complete' | 'incomplete'

function AdminUserDetailContent({ userId }: { userId: string }) {
  const router = useRouter()
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all')
  
  const {
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
  } = useHistory({ userId, pageSize: 20 })

  // Filter entries by completion status
  const filteredEntries = entries.filter((entry) => {
    if (completionFilter === 'all') return true
    if (completionFilter === 'complete') return isCompleteDay(entry)
    if (completionFilter === 'incomplete') return !isCompleteDay(entry)
    return true
  })

  // Export to CSV
  const handleExportCSV = () => {
    if (!user || allEntries.length === 0) return

    const headers = ['Date', 'Rosary', 'Holy Mass', 'Prayer Time (min)', 'Status']
    const rows = allEntries.map((entry) => [
      entry.entry_date,
      entry.rosary_completed ? 'Yes' : 'No',
      entry.holy_mass_attended ? 'Yes' : 'No',
      entry.prayer_time_minutes.toString(),
      isCompleteDay(entry) ? 'Complete' : 'Partial',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${user.name.replace(/\s+/g, '_')}_prayer_history.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Stats cards configuration with more detailed stats for admin
  const statCards = [
    {
      title: 'Total Days',
      value: stats.totalDays,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Rosaries',
      value: stats.rosaryCount,
      subtitle: `${stats.rosaryPercentage}% rate`,
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Masses',
      value: stats.massCount,
      subtitle: `${stats.massPercentage}% rate`,
      icon: Church,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Prayer Time',
      value: formatPrayerTime(stats.totalPrayerMinutes),
      isText: true,
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
      title: 'Longest Streak',
      value: stats.longestStreak,
      subtitle: 'days',
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Complete Days',
      value: stats.completeDays,
      subtitle: `${stats.completePercentage}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Avg Prayer/Day',
      value: stats.totalDays > 0 
        ? Math.round(stats.totalPrayerMinutes / stats.totalDays) 
        : 0,
      subtitle: 'min',
      icon: BarChart3,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
    },
  ]

  // Filter options
  const dateFilterOptions: { value: DateRangeFilter; label: string }[] = [
    { value: 'last7', label: 'Last 7 days' },
    { value: 'last30', label: 'Last 30 days' },
    { value: 'last90', label: 'Last 90 days' },
    { value: 'all', label: 'All time' },
  ]

  const completionFilterOptions: { value: CompletionFilter; label: string }[] = [
    { value: 'all', label: 'All entries' },
    { value: 'complete', label: 'Complete days only' },
    { value: 'incomplete', label: 'Incomplete only' },
  ]

  // Loading state
  if (isLoading && !user) {
    return (
      <BackgroundLayout>
        <div className="pb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-9 w-48" />
          </div>
          <Skeleton className="h-12 w-64 mx-auto mb-2" />
          <Skeleton className="h-6 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
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
            <Button onClick={() => router.push('/admin')} className="mt-6">
              Back to Admin Dashboard
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
            onClick={() => router.push('/admin')}
            className="hover:text-gray-900 transition-colors"
          >
            Admin Dashboard
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{user.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin')}
              className="-ml-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={allEntries.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl flex items-center gap-2">
                  {user.name}
                  {user.is_admin && (
                    <Badge variant="secondary" className="ml-2">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-600">Prayer Activity History</p>
              </div>
            </div>
            {user.email && (
              <p className="text-sm text-gray-500">{user.email}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Member since {formatDate(user.created_at, 'long')}
            </p>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Statistics Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <Card
                key={stat.title}
                className={cn(
                  'relative overflow-hidden transition-all hover:shadow-md card-interactive animate-fade-in-up',
                  stat.borderColor,
                  'border-l-4'
                )}
                style={{
                  animationDelay: `${index * 60}ms`,
                  animationFillMode: 'both',
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <p className={cn('text-xl sm:text-2xl font-bold', stat.color)}>
                          {stat.isText ? stat.value : (stat.value as number).toLocaleString()}
                        </p>
                        {stat.subtitle && (
                          <span className="text-xs text-gray-400">
                            {stat.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn('p-2 rounded-full', stat.bgColor)}>
                      <stat.icon className={cn('h-4 w-4 sm:h-5 sm:w-5', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Complete History Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Complete History
                <Badge variant="secondary" className="ml-2">
                  {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                </Badge>
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={dateFilter}
                  onValueChange={(value) => setDateFilter(value as DateRangeFilter)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={completionFilter}
                  onValueChange={(value) => setCompletionFilter(value as CompletionFilter)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {completionFilterOptions.map((option) => (
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
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
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
                        <TableCell className="text-center">
                          <Skeleton className="h-5 w-16 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-12 text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <Calendar className="h-12 w-12 text-gray-300" />
                          <div>
                            <p className="font-medium">No entries found</p>
                            <p className="text-sm">
                              {completionFilter !== 'all'
                                ? 'Try changing the filter settings.'
                                : 'This user has not recorded any prayer activity yet.'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => {
                      const status = getActivityStatus(entry)
                      return (
                        <TableRow
                          key={entry.id}
                          className={cn(
                            'hover:bg-gray-50 transition-colors',
                            status === 'complete' && 'bg-green-50/50 hover:bg-green-50',
                            status === 'partial' && 'bg-yellow-50/30 hover:bg-yellow-50/50'
                          )}
                        >
                          <TableCell>
                            <span className="font-medium">
                              {formatDate(entry.entry_date)}
                            </span>
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
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-xs',
                                status === 'complete' &&
                                  'bg-green-100 text-green-700',
                                status === 'partial' &&
                                  'bg-yellow-100 text-yellow-700',
                                status === 'minimal' &&
                                  'bg-gray-100 text-gray-600'
                              )}
                            >
                              {status === 'complete'
                                ? 'Complete'
                                : status === 'partial'
                                ? 'Partial'
                                : 'Minimal'}
                            </Badge>
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

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/tracker/${userId}`)}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            View Tracker
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/leaderboard/${userId}`)}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            View Leaderboard
          </Button>
        </div>
      </div>
    </BackgroundLayout>
  )
}
