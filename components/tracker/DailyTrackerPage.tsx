'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { validateDailyEntry, hasEntryData, isToday } from '@/lib/validations'
import type { User, DailyEntry } from '@/lib/database.types'
import { Trophy, Save, Loader2, CheckCircle2, Sparkles, WifiOff, AlertTriangle } from 'lucide-react'

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
  const [isOnline, setIsOnline] = useState(true)

  // Form state
  const [rosaryCompleted, setRosaryCompleted] = useState(false)
  const [holyMassAttended, setHolyMassAttended] = useState(false)
  const [prayerTimeMinutes, setPrayerTimeMinutes] = useState(0)

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false)
  
  // Confirmation dialog state
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [showEmptyDataDialog, setShowEmptyDataDialog] = useState(false)
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false)
  const pendingNavigationRef = useRef<string | null>(null)
  
  // Debounce/throttle rapid submissions
  const lastSaveTimeRef = useRef<number>(0)
  const saveThrottleMs = 2000 // Minimum 2 seconds between saves
  
  // Current date tracking
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0])

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
    
    // Check online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => {
      setIsOnline(false)
      toast({
        variant: 'destructive',
        title: 'You are offline',
        description: 'Your changes will not be saved until you reconnect.',
        duration: 5000,
      })
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [fetchData, toast])
  
  // Monitor date changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = new Date().toISOString().split('T')[0]
      if (newDate !== currentDate) {
        setCurrentDate(newDate)
        // Notify user that date has changed
        toast({
          title: 'New day started! 🌅',
          description: 'The date has changed. Refreshing your tracker...',
        })
        // Refresh data
        fetchData()
      }
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [currentDate, fetchData, toast])

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

  // Save/Update entry using upsert with validation
  const handleSave = async (navigateToLeaderboard: boolean = false, skipValidation: boolean = false) => {
    if (!user) return
    
    // Check online status
    if (!isOnline) {
      toast({
        variant: 'destructive',
        title: 'You are offline',
        description: 'Please check your internet connection and try again.',
      })
      return
    }
    
    // Throttle rapid submissions
    const now = Date.now()
    if (now - lastSaveTimeRef.current < saveThrottleMs) {
      toast({
        title: 'Please wait',
        description: 'You are submitting too quickly. Please wait a moment.',
      })
      return
    }
    
    // Validate entry data
    if (!skipValidation) {
      const validation = validateDailyEntry({
        rosary_completed: rosaryCompleted,
        holy_mass_attended: holyMassAttended,
        prayer_time_minutes: prayerTimeMinutes,
      })
      
      if (!validation.success) {
        // Show empty data dialog
        if (!hasEntryData({ rosary_completed: rosaryCompleted, holy_mass_attended: holyMassAttended, prayer_time_minutes: prayerTimeMinutes })) {
          setShowEmptyDataDialog(true)
          return
        }
        
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: validation.error,
        })
        return
      }
    }

    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)
    lastSaveTimeRef.current = now

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
  
  // Validate prayer time input
  const handlePrayerTimeChange = (minutes: number) => {
    // Clamp value between 0 and 1440 (24 hours)
    const clampedMinutes = Math.max(0, Math.min(1440, Math.floor(minutes)))
    
    if (minutes > 1440) {
      toast({
        title: 'Maximum prayer time exceeded',
        description: 'Prayer time cannot exceed 24 hours (1440 minutes) per day.',
        variant: 'destructive',
      })
    }
    
    setPrayerTimeMinutes(clampedMinutes)
  }
  
  // Handle navigation with unsaved changes
  const handleNavigateWithCheck = (path: string) => {
    if (hasChanges) {
      pendingNavigationRef.current = path
      setShowUnsavedDialog(true)
    } else {
      router.push(path)
    }
  }
  
  // Confirm navigation without saving
  const handleConfirmNavigateWithoutSaving = () => {
    if (pendingNavigationRef.current) {
      router.push(pendingNavigationRef.current)
      pendingNavigationRef.current = null
    }
  }
  
  // Confirm save with empty data
  const handleConfirmSaveEmptyData = () => {
    handleSave(false, true) // Skip validation
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
      <div className="pb-8 animate-fade-in-up">
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-yellow-800">
              <WifiOff className="h-5 w-5" />
              <span className="font-medium">You are offline</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Your changes cannot be saved until you reconnect to the internet.
            </p>
          </div>
        )}
        
        {/* Header */}
        <TrackerHeader userName={user.name} date={today} />

        {/* Error Alert */}
        {error && error !== 'User not found' && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-center text-red-600 animate-fade-in">
            {error}
          </div>
        )}

        {/* Prayer Tracking Cards */}
        <div className="space-y-4">
          <RosaryCheckbox
            checked={rosaryCompleted}
            onCheckedChange={setRosaryCompleted}
            disabled={isSaving || !isOnline}
          />

          <HolyMassCheckbox
            checked={holyMassAttended}
            onCheckedChange={setHolyMassAttended}
            disabled={isSaving || !isOnline}
          />

          <PrayerTimer
            minutes={prayerTimeMinutes}
            onMinutesChange={handlePrayerTimeChange}
            disabled={isSaving || !isOnline}
          />
        </div>

        {/* Today's Summary */}
        <Card className="mt-6 bg-gradient-to-r from-amber-50 to-purple-50 border-none card-interactive">
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
                <div className="text-3xl font-bold text-primary transition-transform duration-300 hover:scale-110">
                  {calculatePoints()}
                </div>
                <div className="text-sm text-gray-500">points</div>
              </div>
            </div>
            
            {/* Progress indicators */}
            <div className="mt-4 flex gap-2">
              <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${rosaryCompleted ? 'bg-amber-400 scale-y-125' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${holyMassAttended ? 'bg-purple-400 scale-y-125' : 'bg-gray-200'}`} />
              <div className={`flex-1 h-2 rounded-full transition-all duration-500 ${prayerTimeMinutes > 0 ? 'bg-blue-400 scale-y-125' : 'bg-gray-200'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={() => handleSave(false)}
            disabled={isSaving || !hasChanges || !isOnline}
            className="gap-2 relative btn-bounce btn-glow"
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
            disabled={isSaving || !isOnline}
            className="gap-2 btn-bounce"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4 transition-transform group-hover:scale-110" />
            )}
            {hasChanges ? 'Save & View Leaderboard' : 'View Leaderboard'}
          </Button>
        </div>

        {/* Unsaved Changes Indicator */}
        {hasChanges && (
          <p className="mt-3 text-center text-sm text-amber-600 flex items-center justify-center gap-1 animate-fade-in">
            <Sparkles className="h-4 w-4 animate-pulse" />
            You have unsaved changes
          </p>
        )}

        {/* Entry Status */}
        {entry && !hasChanges && (
          <p className="mt-4 text-center text-sm text-gray-500 animate-fade-in">
            Last saved: {new Date(entry.updated_at).toLocaleTimeString()}
          </p>
        )}
      </div>
      
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onConfirm={handleConfirmNavigateWithoutSaving}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave without saving?"
        confirmText="Leave Without Saving"
        cancelText="Stay"
        variant="destructive"
      />
      
      <ConfirmDialog
        open={showEmptyDataDialog}
        onOpenChange={setShowEmptyDataDialog}
        onConfirm={handleConfirmSaveEmptyData}
        title="No Activity Recorded"
        description="You haven't completed any activities yet. Do you want to save an empty entry?"
        confirmText="Save Anyway"
        cancelText="Go Back"
      />
    </BackgroundLayout>
  )
}
