'use client'

import { UserCard } from './UserCard'
import type { User } from '@/lib/database.types'
import { Users } from 'lucide-react'

interface UserListProps {
  users: User[]
  isLoading: boolean
  searchQuery: string
}

export function UserList({ users, isLoading, searchQuery }: UserListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Users className="h-8 w-8 text-gray-400" />
        </div>
        {searchQuery ? (
          <>
            <h3 className="font-medium text-gray-900">No results found</h3>
            <p className="text-sm text-gray-500 mt-1">
              No users match &ldquo;{searchQuery}&rdquo;
            </p>
          </>
        ) : (
          <>
            <h3 className="font-medium text-gray-900">No users yet</h3>
            <p className="text-sm text-gray-500 mt-1">
              Click &ldquo;New Soul&rdquo; to add the first user
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
