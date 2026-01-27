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
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import type { User, DailyEntry } from '@/lib/database.types'
import { Trophy, Save, Loader2, CheckCircle2, Sparkles } from 'lucide-react'

interface DailyTrackerPageProps {
  userId: string
}

export function DailyTrackerPage({ userId }: DailyTrackerPageProps) {
  const router = useRouter()
  const { toast } = useToast()
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

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false)

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
      toast({
        variant: 'destructive',
        title: 'Error loading data',
        description: 'Could not load your tracker. Please refresh the page.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId, todayStr, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Track changes
  useEffect(() => {
    if (entry) {
      const changed = 
        rosaryCompleted !== entry.rosary_completed ||
        holyMassAttended !== entry.holy_mass_attended ||
        prayerTimeMinutes !== entry.prayer_time_minutes
      setHasChanges(changed)
    } else {
      // New entry - has changes if any field is set
      setHasChanges(rosaryCompleted || holyMassAttended || prayerTimeMinutes > 0)
    }
  }, [entry, rosaryCompleted, holyMassAttended, prayerTimeMinutes])

  // Save/Update entry using upsert
  const handleSave = async (navigateToLeaderboard: boolean = false) => {
    if (!user) return

    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)

    try {
      // Use upsert with ON CONFLICT handling
      const { data: upsertedEntry, error: upsertError } = await supabase
        .from('daily_entries')
        .upsert(
          {
            id: entry?.id, // Include existing ID if updating
            user_id: userId,
            entry_date: todayStr,
            rosary_completed: rosaryCompleted,
            holy_mass_attended: holyMassAttended,
            prayer_time_minutes: prayerTimeMinutes,
          },
          {
            onConflict: 'user_id,entry_date', // Handle unique constraint
            ignoreDuplicates: false, // Update on conflict
          }
        )
        .select()
        .single()

      if (upsertError) {
        // Handle specific error cases
        if (upsertError.code === '23505') {
          // Unique constraint violation - try update instead
          const { data: updatedEntry, error: updateError } = await supabase
            .from('daily_entries')
            .update({
              rosary_completed: rosaryCompleted,
              holy_mass_attended: holyMassAttended,
              prayer_time_minutes: prayerTimeMinutes,
            })
            .eq('user_id', userId)
            .eq('entry_date', todayStr)
            .select()
            .single()

          if (updateError) throw updateError
          setEntry(updatedEntry)
        } else {
          throw upsertError
        }
      } else {
        setEntry(upsertedEntry)
      }

      setSaveSuccess(true)
      setHasChanges(false)

      // Calculate points for toast message
      const points = calculatePoints()

      // Show success toast
      toast({
        title: '🙏 Progress Saved!',
        description: `Your spiritual journey has been recorded. You earned ${points} points today!`,
      })

      if (navigateToLeaderboard) {
        // Navigate to leaderboard after a short delay
        setTimeout(() => {
          router.push(`/leaderboard/${userId}`)
        }, 500)
      } else {
        // Reset success state after delay
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error saving entry:', err)
      setError('Failed to save. Please try again.')
      
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your progress. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Save and navigate to leaderboard
  const handleSaveAndViewLeaderboard = async () => {
    if (hasChanges) {
      await handleSave(true)
    } else {
      router.push(`/leaderboard/${userId}`)
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
            
            {/* Progress indicators */}
            <div className="mt-4 flex gap-2">
              <div className={`flex-1 h-2 rounded-full transition-colors ${rosaryCompleted ? 'bg-amber-400' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded-full transition-colors ${holyMassAttended ? 'bg-purple-400' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded-full transition-colors ${prayerTimeMinutes > 0 ? 'bg-blue-400' : 'bg-gray-200'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={() => handleSave(false)}
            disabled={isSaving || !hasChanges}
            className="gap-2 relative"
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
            {hasChanges && !isSaving && !saveSuccess && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
            )}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleSaveAndViewLeaderboard}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4" />
            )}
            {hasChanges ? 'Save & View Leaderboard' : 'View Leaderboard'}
          </Button>
        </div>

        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <p className="mt-3 text-center text-sm text-amber-600 flex items-center justify-center gap-1">
            <Sparkles className="h-4 w-4" />
            You have unsaved changes
          </p>
        )}

        {/* Entry Status */}
        {entry && !hasChanges && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Last saved: {new Date(entry.updated_at).toLocaleTimeString()}
          </p>
        )}
      </div>
    </BackgroundLayout>
  )
}
