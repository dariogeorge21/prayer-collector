'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BackgroundLayout } from '@/components/layout'
import { 
  TrackerHeader, 
  RosaryCheckbox, 
  HolyMassCheckbox, 
  PrayerTimer 
} from '@/components/tracker'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { User, DailyEntry } from '@/lib/database.types'
import { Trophy, Save, Loader2, CheckCircle2 } from 'lucide-react'

interface DailyTrackerPageProps {
  userId: string
}

export function DailyTrackerPage({ userId }: DailyTrackerPageProps) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [entry, setEntry] = useState<DailyEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [rosaryCompleted, setRosaryCompleted] = useState(false)
  const [holyMassAttended, setHolyMassAttended] = useState(false)
  const [prayerTimeMinutes, setPrayerTimeMinutes] = useState(0)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Fetch user and today's entry
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        if (userError.code === 'PGRST116') {
          setError('User not found')
        } else {
          throw userError
        }
        return
      }

      setUser(userData)

      // Fetch today's entry if exists
      const { data: entryData, error: entryError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', todayStr)
        .maybeSingle()

      if (entryError) {
        throw entryError
      }

      if (entryData) {
        setEntry(entryData)
        setRosaryCompleted(entryData.rosary_completed)
        setHolyMassAttended(entryData.holy_mass_attended)
        setPrayerTimeMinutes(entryData.prayer_time_minutes)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [userId, todayStr])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Save/Update entry
  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)

    try {
      if (entry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('daily_entries')
          .update({
            rosary_completed: rosaryCompleted,
            holy_mass_attended: holyMassAttended,
            prayer_time_minutes: prayerTimeMinutes,
          })
          .eq('id', entry.id)

        if (updateError) throw updateError
      } else {
        // Create new entry
        const { data: newEntry, error: insertError } = await supabase
          .from('daily_entries')
          .insert({
            user_id: userId,
            entry_date: todayStr,
            rosary_completed: rosaryCompleted,
            holy_mass_attended: holyMassAttended,
            prayer_time_minutes: prayerTimeMinutes,
          })
          .select()
          .single()

        if (insertError) throw insertError
        setEntry(newEntry)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving entry:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate today's points
  const calculatePoints = () => {
    let points = 0
    if (rosaryCompleted) points += 10
    if (holyMassAttended) points += 15
    points += prayerTimeMinutes
    return points
  }

  // Loading state
  if (isLoading) {
    return (
      <BackgroundLayout>
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-4 text-gray-500">Loading your tracker...</p>
        </div>
      </BackgroundLayout>
    )
  }

  // Error state - user not found
  if (error === 'User not found' || !user) {
    return (
      <BackgroundLayout>
        <div className="flex min-h-[80vh] flex-col items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">User Not Found</h2>
            <p className="mt-2 text-gray-500">
              This user doesn&apos;t exist or has been removed.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="mt-6"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </BackgroundLayout>
    )
  }

  return (
    <BackgroundLayout>
      <div className="pb-8">
        {/* Header */}
        <TrackerHeader userName={user.name} date={today} />

        {/* Error Alert */}
        {error && error !== 'User not found' && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-600">
            {error}
          </div>
        )}

        {/* Prayer Tracking Cards */}
        <div className="space-y-4">
          <RosaryCheckbox
            checked={rosaryCompleted}
            onCheckedChange={setRosaryCompleted}
            disabled={isSaving}
          />

          <HolyMassCheckbox
            checked={holyMassAttended}
            onCheckedChange={setHolyMassAttended}
            disabled={isSaving}
          />

          <PrayerTimer
            minutes={prayerTimeMinutes}
            onMinutesChange={setPrayerTimeMinutes}
            disabled={isSaving}
          />
        </div>

        {/* Today's Summary */}
        <Card className="mt-6 bg-gradient-to-r from-amber-50 to-purple-50 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Today&apos;s Progress</h3>
                <p className="text-sm text-gray-600">
                  {rosaryCompleted || holyMassAttended || prayerTimeMinutes > 0
                    ? 'Great job! Keep up the good work.'
                    : 'Start tracking your prayers for today.'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {calculatePoints()}
                </div>
                <div className="text-sm text-gray-500">points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Progress
              </>
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push(`/leaderboard/${userId}`)}
            className="gap-2"
          >
            <Trophy className="h-4 w-4" />
            View Leaderboard
          </Button>
        </div>

        {/* Entry Status */}
        {entry && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Entry last updated: {new Date(entry.updated_at).toLocaleTimeString()}
          </p>
        )}
      </div>
    </BackgroundLayout>
  )
}
