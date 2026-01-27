'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Pause, RotateCcw } from 'lucide-react'

interface PrayerTimerProps {
  minutes: number
  onMinutesChange: (minutes: number) => void
  disabled?: boolean
}

export function PrayerTimer({ 
  minutes, 
  onMinutesChange, 
  disabled 
}: PrayerTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [manualInput, setManualInput] = useState(minutes.toString())

  // Sync manual input with external minutes value
  useEffect(() => {
    if (!isRunning) {
      setManualInput(minutes.toString())
    }
  }, [minutes, isRunning])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const newSeconds = prev + 1
          // Update minutes every 60 seconds
          if (newSeconds % 60 === 0) {
            const newMinutes = Math.floor(newSeconds / 60) + minutes
            onMinutesChange(newMinutes)
          }
          return newSeconds
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, minutes, onMinutesChange])

  const formatTime = useCallback((totalMinutes: number, secs: number) => {
    const displayMinutes = totalMinutes + Math.floor(secs / 60)
    const displaySeconds = secs % 60
    return `${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`
  }, [])

  const handleStartPause = () => {
    setIsRunning((prev) => !prev)
  }

  const handleReset = () => {
    setIsRunning(false)
    setSeconds(0)
    onMinutesChange(0)
    setManualInput('0')
  }

  const handleManualChange = (value: string) => {
    setManualInput(value)
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1440) {
      onMinutesChange(parsed)
    }
  }

  const addMinutes = (amount: number) => {
    const newValue = Math.max(0, Math.min(1440, minutes + amount))
    onMinutesChange(newValue)
    setManualInput(newValue.toString())
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl">
            🕐
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <Label className="text-lg font-semibold text-gray-900">
              Personal Prayer Time
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Track your meditation and prayer
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="mt-6 text-center">
          <div className="text-5xl font-mono font-bold text-gray-900 tracking-wider">
            {formatTime(minutes, seconds)}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isRunning ? 'Timer running...' : 'minutes : seconds'}
          </p>
        </div>

        {/* Timer Controls */}
        <div className="mt-6 flex justify-center gap-3">
          <Button
            type="button"
            variant={isRunning ? 'destructive' : 'default'}
            size="lg"
            onClick={handleStartPause}
            disabled={disabled}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleReset}
            disabled={disabled || isRunning}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Manual Input & Quick Add */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="manual-minutes" className="text-sm text-gray-600 whitespace-nowrap">
              Or enter manually:
            </Label>
            <Input
              id="manual-minutes"
              type="number"
              min="0"
              max="1440"
              value={manualInput}
              onChange={(e) => handleManualChange(e.target.value)}
              disabled={disabled || isRunning}
              className="w-24 text-center"
            />
            <span className="text-sm text-gray-500">min</span>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[5, 10, 15, 30].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addMinutes(amount)}
                disabled={disabled || isRunning}
              >
                +{amount} min
              </Button>
            ))}
          </div>
        </div>

        {/* Points Display */}
        {minutes > 0 && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 text-center">
            ⏱️ {minutes} minute{minutes !== 1 ? 's' : ''} of prayer = +{minutes} points
          </div>
        )}
      </CardContent>
    </Card>
  )
}
