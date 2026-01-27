import { HistoryPage } from '@/components/history/HistoryPage'

interface HistoryPageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function UserHistoryPage({ params }: HistoryPageProps) {
  const { userId } = await params
  return <HistoryPage userId={userId} />
}
