'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStats, type SortField } from '@/hooks/use-user-stats'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Flame,
  Shield,
  Users,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function UserStatsTable() {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  const {
    users,
    totalCount,
    currentPage,
    totalPages,
    isLoading,
    sortField,
    sortDirection,
    setPage,
    setSort,
    setSearchQuery,
    refresh,
    exportToCSV,
  } = useUserStats({ pageSize: 10 })

  // Update search query when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearch)
  }, [debouncedSearch, setSearchQuery])

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
  }

  // Format prayer time
  const formatPrayerTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-3 w-3 text-primary" />
      : <ArrowDown className="ml-1 h-3 w-3 text-primary" />
  }

  // Sortable header component
  const SortableHeader = ({ 
    field, 
    children,
    className,
  }: { 
    field: SortField
    children: React.ReactNode
    className?: string
  }) => (
    <TableHead className={className}>
      <button
        onClick={() => setSort(field)}
        className="flex items-center hover:text-primary transition-colors font-medium"
      >
        {children}
        <SortIndicator field={field} />
      </button>
    </TableHead>
  )

  // Loading skeleton rows
  const LoadingSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
          <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Statistics
            <span className="text-sm font-normal text-gray-500">
              ({totalCount} users)
            </span>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={users.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        {/* Search input */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="name">Name</SortableHeader>
                <SortableHeader field="total_entries" className="text-center">Entries</SortableHeader>
                <SortableHeader field="last_active_date" className="text-center">Last Active</SortableHeader>
                <SortableHeader field="total_rosaries" className="text-center">Rosaries</SortableHeader>
                <SortableHeader field="total_masses" className="text-center">Masses</SortableHeader>
                <SortableHeader field="total_prayer_minutes" className="text-center">Prayer Time</SortableHeader>
                <SortableHeader field="current_streak" className="text-center">Streak</SortableHeader>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <LoadingSkeleton />
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {searchInput ? 'No users found matching your search.' : 'No users found.'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.name}</span>
                        {user.is_admin && (
                          <span title="Admin">
                            <Shield className="h-4 w-4 text-primary" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {user.total_entries}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {formatDate(user.last_active_date)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-purple-600 font-medium">{user.total_rosaries}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-amber-600 font-medium">{user.total_masses}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-blue-600 font-medium">
                        {formatPrayerTime(user.total_prayer_minutes)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "flex items-center justify-center gap-1 font-medium",
                        user.current_streak >= 7 && "text-amber-500"
                      )}>
                        {user.current_streak}
                        {user.current_streak >= 7 && <Flame className="h-4 w-4" />}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/user/${user.id}`)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
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
              <div className="flex items-center gap-1 mx-2">
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
                      variant={currentPage === pageNum ? "default" : "outline"}
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
  )
}
