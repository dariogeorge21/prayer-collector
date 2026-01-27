import { BackgroundLayout } from '@/components/layout'

export default function HomePage() {
  return (
    <BackgroundLayout>
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Faith Tracker
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Track your spiritual journey with daily prayers and devotions
          </p>
        </div>

        {/* Placeholder for User Selection */}
        <div className="w-full max-w-md rounded-xl bg-white/80 p-8 shadow-lg backdrop-blur-sm">
          <p className="text-center text-gray-500">
            User selection will appear here
          </p>
        </div>
      </div>
    </BackgroundLayout>
  )
}
