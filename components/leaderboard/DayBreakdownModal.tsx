'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDateLabel, type ContributionDay } from '@/lib/contribution-utils'

interface DayBreakdownModalProps {
  day: ContributionDay | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DayBreakdownModal({
  day,
  open,
  onOpenChange,
}: DayBreakdownModalProps) {
  if (!day) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            {formatDateLabel(day.date)}
          </DialogTitle>
          <DialogDescription>Score breakdown for this day</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <BreakdownRow
            emoji="📿"
            label="Rosary"
            value={day.rosary ? 'Completed' : 'Not completed'}
            points={day.rosary ? 10 : 0}
          />
          <BreakdownRow
            emoji="⛪"
            label="Holy Mass"
            value={day.mass ? 'Attended' : 'Not attended'}
            points={day.mass ? 15 : 0}
          />
          <BreakdownRow
            emoji="🕐"
            label="Prayer Time"
            value={`${day.prayerMinutes} min`}
            points={day.prayerMinutes}
          />

          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Total Score
            </span>
            <span className="text-xl font-bold text-primary">{day.score}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BreakdownRow({
  emoji,
  label,
  value,
  points,
}: {
  emoji: string
  label: string
  value: string
  points: number
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {label}
          </div>
          <div className="text-gray-500 dark:text-gray-400">{value}</div>
        </div>
      </div>
      <span className="font-semibold text-primary">+{points}</span>
    </div>
  )
}
