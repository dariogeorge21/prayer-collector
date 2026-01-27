'use client'

import { ArrowLeft, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface TrackerHeaderProps {
  userName: string
  date: Date
}

export function TrackerHeader({ userName, date }: TrackerHeaderProps) {
  const router = useRouter()

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <header className="mb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/')}
        className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Users
      </Button>

      {/* Title and Date */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Welcome, {userName}! 🙏
        </h1>
        <div className="mt-3 flex items-center justify-center gap-2 text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(date)}</span>
        </div>
      </div>
    </header>
  )
}
