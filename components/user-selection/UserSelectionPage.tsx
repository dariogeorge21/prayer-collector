'use client'

import { useState, useEffect, useMemo } from 'react'
import { BackgroundLayout } from '@/components/layout'
import { 
  SearchInput, 
  UserList, 
  NewUserModal 
} from '@/components/user-selection'
import { useDebounce } from '@/hooks/use-debounce'
import { supabase } from '@/lib/supabase'
import type { User } from '@/lib/database.types'

export function UserSelectionPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true })

      if (supabaseError) {
        throw supabaseError
      }

      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter users based on debounced search query
  const filteredUsers = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return users
    }

    const query = debouncedSearch.toLowerCase()
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    )
  }, [users, debouncedSearch])

  // Handle new user creation
  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [...prev, newUser].sort((a, b) => 
      a.name.localeCompare(b.name)
    ))
  }

  return (
    <BackgroundLayout>
      <div className="flex min-h-[90vh] flex-col animate-fade-in-up">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="flex justify-end mb-2">
            <a 
              href="/admin" 
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Admin
            </a>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            <span className="inline-block animate-bounce-subtle">✝️</span> Faith Tracker
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Track your spiritual journey with daily prayers and devotions
          </p>
        </header>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mx-auto max-w-2xl">
            {/* Search and Add User Row */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by name or email..."
                />
              </div>
              <NewUserModal onUserCreated={handleUserCreated} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-600 animate-fade-in">
                {error}
                <button
                  onClick={fetchUsers}
                  className="ml-2 underline hover:no-underline btn-bounce"
                >
                  Retry
                </button>
              </div>
            )}

            {/* User List */}
            <UserList
              users={filteredUsers}
              isLoading={isLoading}
              searchQuery={debouncedSearch}
            />

            {/* User Count */}
            {!isLoading && users.length > 0 && (
              <p className="mt-6 text-center text-sm text-gray-500 animate-fade-in">
                {filteredUsers.length === users.length
                  ? `${users.length} soul${users.length === 1 ? '' : 's'} registered`
                  : `Showing ${filteredUsers.length} of ${users.length} souls`}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 py-6 text-center border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Jesus Youth Pala Campus Ministry
          </p>
        </footer>
      </div>
    </BackgroundLayout>
  )
}
