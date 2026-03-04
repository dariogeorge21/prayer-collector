'use client'

import { useInactiveUsers } from '@/hooks/use-inactive-users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, UserX, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function InactiveUsersSection() {
  const { users, isLoading, isValidating, refresh } = useInactiveUsers()

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <UserX className="h-5 w-5 text-rose-500" />
          No Entry Today
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refresh()}
          disabled={isValidating}
          className="text-gray-600 hover:text-gray-900"
        >
          <RefreshCw className={cn('h-4 w-4 mr-2', isValidating && 'animate-spin')} />
          {isValidating ? 'Updating...' : 'Refresh'}
        </Button>
      </div>

      <Card className="border-rose-100 border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-gray-700">
              Users with no entry on{' '}
              <span className="text-rose-600">{today}</span>
            </CardTitle>
            {!isLoading && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-sm font-semibold px-3 py-1',
                  users.length === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-rose-100 text-rose-700'
                )}
              >
                {users.length === 0 ? '🎉 All active!' : `${users.length} inactive`}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-green-600">
              <Users className="h-10 w-10 mb-2 opacity-70" />
              <p className="font-medium">All users have submitted an entry today!</p>
              <p className="text-sm text-gray-400 mt-1">Check back later if new users join.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {users.map((user, index) => (
                <li
                  key={user.id}
                  className={cn(
                    'flex items-center gap-3 py-2.5 px-1 rounded-md transition-colors hover:bg-rose-50/60 animate-fade-in-up'
                  )}
                  style={{
                    animationDelay: `${index * 40}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-xs font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">{user.name}</span>
                  <Badge variant="outline" className="text-xs text-rose-500 border-rose-200">
                    No entry
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
