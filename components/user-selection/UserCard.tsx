'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { User, ChevronRight } from 'lucide-react'
import type { User as UserType } from '@/lib/database.types'

interface UserCardProps {
  user: UserType
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/tracker/${user.id}`)
  }

  // Get initials from name
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/20 bg-white/90 backdrop-blur-sm"
      onClick={handleClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
          {initials || <User className="h-5 w-5" />}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {user.name}
          </h3>
          {user.email && (
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
          )}
        </div>
        
        {/* Arrow */}
        <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </CardContent>
    </Card>
  )
}
