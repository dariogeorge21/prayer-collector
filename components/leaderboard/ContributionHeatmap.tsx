'use client'

import React, { useMemo, useState, useCallback } from 'react'
import { useUserContributions } from '@/hooks/use-user-contributions'
import {
  generateHeatmapGrid,
  getMonthLabels,
  formatDateLabel,
  type ContributionDay,
} from '@/lib/contribution-utils'
import { DayBreakdownModal } from './DayBreakdownModal'
import { cn } from '@/lib/utils'
import { Flame, Calendar, Loader2, TrendingUp } from 'lucide-react'

// ── Constants ────────────────────────────────────────────

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'] as const

const LEVEL_COLORS: Record<number, string> = {
  0: 'bg-gray-100 dark:bg-gray-800',
  1: 'bg-purple-200 dark:bg-purple-900',
  2: 'bg-purple-400 dark:bg-purple-700',
  3: 'bg-purple-500 dark:bg-purple-500',
  4: 'bg-purple-700 dark:bg-purple-300',
}

const CELL_SIZE = 11
const CELL_GAP = 3
const CELL_STEP = CELL_SIZE + CELL_GAP

// ── Types ────────────────────────────────────────────────

interface ContributionHeatmapProps {
  userId: string
  userName: string
  currentStreak?: number
}

// ── Component ────────────────────────────────────────────

function ContributionHeatmapInner({
  userId,
  userName,
  currentStreak,
}: ContributionHeatmapProps) {
  const { data, isLoading, error } = useUserContributions({
    userId,
    enabled: true,
  })

  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const weeks = useMemo(
    () => (data ? generateHeatmapGrid(data) : []),
    [data],
  )

  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])

  const handleCellClick = useCallback((day: ContributionDay) => {
    setSelectedDay(day)
    setModalOpen(true)
  }, [])

  // ── Loading ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Loading contributions…</span>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        Unable to load contribution data.
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Stats row */}
      <div className="flex flex-wrap gap-2 text-sm">
        <StatBadge
          icon={<Calendar className="h-3.5 w-3.5 text-blue-500" />}
          label="Active"
          value={`${data.activeDays}d`}
        />
        {currentStreak !== undefined && (
          <StatBadge
            icon={<Flame className="h-3.5 w-3.5 text-amber-500" />}
            label="Streak"
            value={`${currentStreak}d`}
          />
        )}
        <StatBadge
          icon={<TrendingUp className="h-3.5 w-3.5 text-orange-500" />}
          label="Best Streak"
          value={`${data.longestStreak}d`}
        />
        <StatBadge
          icon={<Flame className="h-3.5 w-3.5 text-purple-500" />}
          label="Max Day"
          value={String(data.maxScore)}
        />
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="inline-flex">
          {/* Day labels column */}
          <div
            className="flex flex-col shrink-0 mr-1"
            style={{ gap: CELL_GAP, paddingTop: 18 }}
            aria-hidden="true"
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-400 dark:text-gray-500 leading-none flex items-center justify-end pr-0.5"
                style={{ height: CELL_SIZE, width: 24 }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid area */}
          <div className="relative">
            {/* Month labels */}
            <div className="h-[18px] relative" aria-hidden="true">
              {monthLabels.map(({ label, colIndex }, i) => (
                <span
                  key={i}
                  className="absolute text-[10px] text-gray-400 dark:text-gray-500 leading-none whitespace-nowrap"
                  style={{ left: colIndex * CELL_STEP }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Cells grid */}
            <div
              className="grid"
              style={{
                gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                gridAutoFlow: 'column',
                gridAutoColumns: `${CELL_SIZE}px`,
                gap: CELL_GAP,
              }}
              role="grid"
              aria-label={`Contribution heatmap for ${userName}, last 365 days`}
            >
              {weeks.flatMap((week, wi) =>
                week.days.map((day, di) => {
                  if (!day) {
                    return (
                      <div
                        key={`${wi}-${di}`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                        aria-hidden="true"
                      />
                    )
                  }

                  const label = `${formatDateLabel(day.date)} – Score: ${day.score}`

                  return (
                    <button
                      key={`${wi}-${di}`}
                      type="button"
                      className={cn(
                        'rounded-[2px] transition-all duration-150',
                        'hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500',
                        'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                        LEVEL_COLORS[day.level],
                      )}
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      title={label}
                      aria-label={label}
                      onClick={() => handleCellClick(day)}
                    />
                  )
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn('rounded-[2px]', LEVEL_COLORS[level])}
            style={{ width: CELL_SIZE, height: CELL_SIZE }}
            aria-hidden="true"
          />
        ))}
        <span>More</span>
      </div>

      {/* Day breakdown modal */}
      <DayBreakdownModal
        day={selectedDay}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}

// ── StatBadge ────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-1 bg-muted/60 dark:bg-muted/30 px-2.5 py-1 rounded-full text-xs">
      {icon}
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </span>
    </div>
  )
}

// ── Memoized export ──────────────────────────────────────

export const ContributionHeatmap = React.memo(ContributionHeatmapInner)
ContributionHeatmap.displayName = 'ContributionHeatmap'
