import { BackgroundLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface LeaderboardPageProps {
  params: Promise<{ userId: string }>
}

export default async function LeaderboardPage({ params }: LeaderboardPageProps) {
  const { userId } = await params

  return (
    <BackgroundLayout>
      <div className="pb-8">
        {/* Back Button */}
        <Link href={`/tracker/${userId}`}>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tracker
          </Button>
        </Link>

        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏆 Leaderboard
            </h1>
            <p className="text-gray-500">
              Coming soon...
            </p>
          </div>
        </div>
      </div>
    </BackgroundLayout>
  )
}
