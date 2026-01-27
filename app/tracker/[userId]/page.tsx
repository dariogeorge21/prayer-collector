import { BackgroundLayout } from '@/components/layout'

interface TrackerPageProps {
  params: Promise<{ userId: string }>
}

export default async function TrackerPage({ params }: TrackerPageProps) {
  const { userId } = await params

  return (
    <BackgroundLayout>
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-white/90 p-8 shadow-lg backdrop-blur-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Daily Tracker
          </h1>
          <p className="text-gray-500">
            User ID: {userId}
          </p>
          <p className="text-sm text-gray-400 mt-4">
            Tracker page coming soon...
          </p>
        </div>
      </div>
    </BackgroundLayout>
  )
}
