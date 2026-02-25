import type { DailyEntry } from './database.types'

// ── Types ────────────────────────────────────────────────

/** Minimal entry shape needed for contribution calculations */
export type ContributionEntry = Pick<
  DailyEntry,
  'entry_date' | 'rosary_completed' | 'holy_mass_attended' | 'prayer_time_minutes'
>

/** A single day's contribution data for the heatmap */
export interface ContributionDay {
  date: string // YYYY-MM-DD
  score: number
  rosary: boolean
  mass: boolean
  prayerMinutes: number
  level: 0 | 1 | 2 | 3 | 4
}

/** Processed contribution data for a user */
export interface ContributionData {
  days: Map<string, ContributionDay>
  maxScore: number
  totalScore: number
  activeDays: number
  longestStreak: number
}

/** A week column of the heatmap grid (7 slots, Mon–Sun) */
export interface HeatmapWeek {
  days: (ContributionDay | null)[]
}

/** Month label positioned at its starting week column */
export interface MonthLabel {
  label: string
  colIndex: number
}

// ── Scoring ──────────────────────────────────────────────

/**
 * Calculate the daily score for a single entry.
 *
 * Rosary   = 10 points
 * Mass     = 15 points
 * Prayer   = raw minutes
 */
export function calculateDailyScore(entry: {
  rosary_completed: boolean
  holy_mass_attended: boolean
  prayer_time_minutes: number
}): number {
  return (
    (entry.rosary_completed ? 10 : 0) +
    (entry.holy_mass_attended ? 15 : 0) +
    entry.prayer_time_minutes
  )
}

// ── Internal Helpers ─────────────────────────────────────

function getContributionLevel(
  score: number,
  maxScore: number,
): 0 | 1 | 2 | 3 | 4 {
  if (score === 0 || maxScore === 0) return 0
  const ratio = score / maxScore
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

/** Format a Date to YYYY-MM-DD using local timezone */
function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Date Formatting ──────────────────────────────────────

/** Human-readable date label, e.g. "Monday, March 12, 2026" */
export function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Processing ───────────────────────────────────────────

/** Process raw daily_entries into contribution data */
export function processContributions(
  entries: ContributionEntry[],
): ContributionData {
  const days = new Map<string, ContributionDay>()
  let maxScore = 0
  let totalScore = 0
  let activeDays = 0

  // First pass – compute scores and find max
  for (const entry of entries) {
    const score = calculateDailyScore(entry)
    if (score > maxScore) maxScore = score
    totalScore += score
    if (score > 0) activeDays++

    days.set(entry.entry_date, {
      date: entry.entry_date,
      score,
      rosary: entry.rosary_completed,
      mass: entry.holy_mass_attended,
      prayerMinutes: entry.prayer_time_minutes,
      level: 0, // assigned in second pass
    })
  }

  // Second pass – assign intensity levels
  for (const [key, day] of days) {
    days.set(key, {
      ...day,
      level: getContributionLevel(day.score, maxScore),
    })
  }

  return {
    days,
    maxScore,
    totalScore,
    activeDays,
    longestStreak: calculateLongestStreak(entries),
  }
}

// ── Streak Calculation ───────────────────────────────────

function calculateLongestStreak(entries: ContributionEntry[]): number {
  if (entries.length === 0) return 0

  const sortedDates = entries.map((e) => e.entry_date).sort()
  const dateSet = new Set(sortedDates)

  let longest = 0
  let current = 0

  const cursor = new Date(sortedDates[0] + 'T00:00:00')
  const end = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00')

  while (cursor <= end) {
    if (dateSet.has(toDateString(cursor))) {
      current++
      if (current > longest) longest = current
    } else {
      current = 0
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return longest
}

// ── Heatmap Grid ─────────────────────────────────────────

/** Build the week-column grid structure for the heatmap */
export function generateHeatmapGrid(
  contributionData: ContributionData,
  daysCount = 365,
): HeatmapWeek[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rangeStart = new Date(today)
  rangeStart.setDate(rangeStart.getDate() - daysCount + 1)

  // Rewind to Monday of the starting week (ISO: Mon = 1)
  const dayOfWeek = rangeStart.getDay() // 0 = Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const gridStart = new Date(rangeStart)
  gridStart.setDate(gridStart.getDate() + mondayOffset)

  const weeks: HeatmapWeek[] = []
  const cursor = new Date(gridStart)

  while (cursor <= today) {
    const week: (ContributionDay | null)[] = []

    for (let d = 0; d < 7; d++) {
      if (cursor > today || cursor < rangeStart) {
        week.push(null)
      } else {
        const dateStr = toDateString(cursor)
        week.push(
          contributionData.days.get(dateStr) ?? {
            date: dateStr,
            score: 0,
            rosary: false,
            mass: false,
            prayerMinutes: 0,
            level: 0,
          },
        )
      }
      cursor.setDate(cursor.getDate() + 1)
    }

    weeks.push({ days: week })
  }

  return weeks
}

/** Get month labels positioned at their starting week columns */
export function getMonthLabels(weeks: HeatmapWeek[]): MonthLabel[] {
  const labels: MonthLabel[] = []
  let lastMonth = -1

  for (let i = 0; i < weeks.length; i++) {
    const firstDay = weeks[i].days.find((d) => d !== null)
    if (!firstDay) continue

    const date = new Date(firstDay.date + 'T00:00:00')
    const month = date.getMonth()

    if (month !== lastMonth) {
      lastMonth = month
      labels.push({
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        colIndex: i,
      })
    }
  }

  return labels
}
