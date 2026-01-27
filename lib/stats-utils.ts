import type { DailyEntry } from './database.types'

export interface StatsObject {
  totalDays: number
  rosaryCount: number
  massCount: number
  totalPrayerMinutes: number
  rosaryPercentage: number
  massPercentage: number
  completeDays: number
  completePercentage: number
}

export interface DateRange {
  start: Date
  end: Date
}

export type DateRangeFilter = 'last7' | 'last30' | 'last90' | 'all'

/**
 * Calculate current consecutive days streak with any activity
 * Starts from today and counts backwards
 */
export function calculateStreak(entries: DailyEntry[]): number {
  if (!entries || entries.length === 0) return 0

  // Sort entries by date descending
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const firstEntryDate = new Date(sortedEntries[0].entry_date)
  firstEntryDate.setHours(0, 0, 0, 0)

  // Determine starting point for streak calculation
  let expectedDate: Date
  if (firstEntryDate.getTime() === today.getTime()) {
    expectedDate = today
  } else if (firstEntryDate.getTime() === yesterday.getTime()) {
    expectedDate = yesterday
  } else {
    return 0 // No recent activity
  }

  let streak = 0
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.entry_date)
    entryDate.setHours(0, 0, 0, 0)

    // Check if entry has any activity
    const hasActivity =
      entry.rosary_completed ||
      entry.holy_mass_attended ||
      entry.prayer_time_minutes > 0

    if (entryDate.getTime() === expectedDate.getTime() && hasActivity) {
      streak++
      expectedDate = new Date(expectedDate)
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else if (entryDate.getTime() < expectedDate.getTime()) {
      // Gap in dates, streak is broken
      break
    }
  }

  return streak
}

/**
 * Find the longest streak in the entire history
 * Considers any activity as continuing the streak
 */
export function calculateLongestStreak(entries: DailyEntry[]): number {
  if (!entries || entries.length === 0) return 0

  // Filter entries with activity and sort by date ascending
  const activeEntries = entries
    .filter(
      (entry) =>
        entry.rosary_completed ||
        entry.holy_mass_attended ||
        entry.prayer_time_minutes > 0
    )
    .sort(
      (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    )

  if (activeEntries.length === 0) return 0
  if (activeEntries.length === 1) return 1

  let longestStreak = 1
  let currentStreak = 1

  for (let i = 1; i < activeEntries.length; i++) {
    const prevDate = new Date(activeEntries[i - 1].entry_date)
    const currDate = new Date(activeEntries[i].entry_date)
    prevDate.setHours(0, 0, 0, 0)
    currDate.setHours(0, 0, 0, 0)

    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      // Gap in days, reset streak
      currentStreak = 1
    }
  }

  return longestStreak
}

/**
 * Calculate comprehensive statistics from entries
 */
export function calculateTotalStats(entries: DailyEntry[]): StatsObject {
  if (!entries || entries.length === 0) {
    return {
      totalDays: 0,
      rosaryCount: 0,
      massCount: 0,
      totalPrayerMinutes: 0,
      rosaryPercentage: 0,
      massPercentage: 0,
      completeDays: 0,
      completePercentage: 0,
    }
  }

  const totalDays = entries.length
  const rosaryCount = entries.filter((e) => e.rosary_completed).length
  const massCount = entries.filter((e) => e.holy_mass_attended).length
  const totalPrayerMinutes = entries.reduce(
    (sum, e) => sum + (e.prayer_time_minutes || 0),
    0
  )
  
  // Complete days = all three activities done
  const completeDays = entries.filter(
    (e) => e.rosary_completed && e.holy_mass_attended && e.prayer_time_minutes > 0
  ).length

  return {
    totalDays,
    rosaryCount,
    massCount,
    totalPrayerMinutes,
    rosaryPercentage: totalDays > 0 ? Math.round((rosaryCount / totalDays) * 100) : 0,
    massPercentage: totalDays > 0 ? Math.round((massCount / totalDays) * 100) : 0,
    completeDays,
    completePercentage: totalDays > 0 ? Math.round((completeDays / totalDays) * 100) : 0,
  }
}

/**
 * Convert minutes to human-readable format
 */
export function formatPrayerTime(minutes: number): string {
  if (minutes <= 0) return '0 minutes'
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`
}

/**
 * Short format for prayer time (e.g., "2h 30m")
 */
export function formatPrayerTimeShort(minutes: number): string {
  if (minutes <= 0) return '0m'
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Convert filter strings to date ranges
 */
export function getDateRange(filter: DateRangeFilter): DateRange {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  switch (filter) {
    case 'last7':
      start.setDate(start.getDate() - 6) // Including today
      break
    case 'last30':
      start.setDate(start.getDate() - 29) // Including today
      break
    case 'last90':
      start.setDate(start.getDate() - 89) // Including today
      break
    case 'all':
      start.setFullYear(2000) // Far past date
      break
    default:
      start.setDate(start.getDate() - 29) // Default to last 30 days
  }

  return { start, end }
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateStr)
  
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if an entry has complete activity (all three done)
 */
export function isCompleteDay(entry: DailyEntry): boolean {
  return (
    entry.rosary_completed &&
    entry.holy_mass_attended &&
    entry.prayer_time_minutes > 0
  )
}

/**
 * Check if an entry has any activity
 */
export function hasAnyActivity(entry: DailyEntry): boolean {
  return (
    entry.rosary_completed ||
    entry.holy_mass_attended ||
    entry.prayer_time_minutes > 0
  )
}

/**
 * Get activity status label
 */
export function getActivityStatus(entry: DailyEntry): 'complete' | 'partial' | 'minimal' {
  const activities = [
    entry.rosary_completed,
    entry.holy_mass_attended,
    entry.prayer_time_minutes > 0,
  ].filter(Boolean).length

  if (activities === 3) return 'complete'
  if (activities >= 1) return 'partial'
  return 'minimal'
}
