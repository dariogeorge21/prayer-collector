import { LeaderboardPage } from '@/components/leaderboard'

interface LeaderboardRouteProps {
  params: Promise<{ userId: string }>
}

export default async function LeaderboardRoute({ params }: LeaderboardRouteProps) {
  const { userId } = await params

  return <LeaderboardPage userId={userId} />
}
