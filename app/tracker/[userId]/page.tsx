import { DailyTrackerPage } from '@/components/tracker'

interface TrackerPageProps {
  params: Promise<{ userId: string }>
}

export default async function TrackerPage({ params }: TrackerPageProps) {
  const { userId } = await params

  return <DailyTrackerPage userId={userId} />
}
