'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, Pause, RotateCcw, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrayerTimerProps {
  minutes: number
  onMinutesChange: (minutes: number) => void
  disabled?: boolean
}

type TimerState = 'idle' | 'running' | 'paused'

export function PrayerTimer({ 
  minutes, 
  onMinutesChange, 
  disabled 
}: PrayerTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [totalSeconds, setTotalSeconds] = useState(minutes * 60)
  const [manualInput, setManualInput] = useState(minutes.toString())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedRef = useRef<number>(minutes * 60)

  // Sync with external minutes value on mount or when minutes prop changes significantly
  useEffect(() => {
    if (timerState === 'idle') {
      const externalSeconds = minutes * 60
      setTotalSeconds(externalSeconds)
      accumulatedRef.current = externalSeconds
      setManualInput(minutes.toString())
    }
  }, [minutes, timerState])

  // Timer logic using requestAnimationFrame for accuracy
  useEffect(() => {
    if (timerState === 'running') {
      startTimeRef.current = Date.now()
      
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)
        const newTotal = accumulatedRef.current + elapsed
        setTotalSeconds(newTotal)
        
        // Update parent with minutes (for database storage)
        const newMinutes = Math.floor(newTotal / 60)
        if (newMinutes !== minutes) {
          onMinutesChange(newMinutes)
        }
      }, 100) // Update more frequently for smoother display
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [timerState, minutes, onMinutesChange])

  // Format time as MM:SS
  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60)
    const remainingSecs = secs % 60
    return {
      minutes: mins.toString().padStart(2, '0'),
      seconds: remainingSecs.toString().padStart(2, '0'),
    }
  }, [])

  const handleStart = () => {
    if (timerState === 'idle' || timerState === 'paused') {
      accumulatedRef.current = totalSeconds
      setTimerState('running')
    }
  }

  const handlePause = () => {
    if (timerState === 'running') {
      // Save accumulated time
      const elapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)
      accumulatedRef.current = accumulatedRef.current + elapsed
      setTotalSeconds(accumulatedRef.current)
      setTimerState('paused')
    }
  }

  const handleReset = () => {
    setTimerState('idle')
    setTotalSeconds(0)
    accumulatedRef.current = 0
    onMinutesChange(0)
    setManualInput('0')
    startTimeRef.current = null
  }

  const handleManualChange = (value: string) => {
    setManualInput(value)
    const parsed = parseInt(value, 10)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1440) {
      const newSeconds = parsed * 60
      setTotalSeconds(newSeconds)
      accumulatedRef.current = newSeconds
      onMinutesChange(parsed)
    }
  }

  const addMinutes = (amount: number) => {
    const currentMinutes = Math.floor(totalSeconds / 60)
    const newMinutes = Math.max(0, Math.min(1440, currentMinutes + amount))
    const newSeconds = newMinutes * 60
    setTotalSeconds(newSeconds)
    accumulatedRef.current = newSeconds
    onMinutesChange(newMinutes)
    setManualInput(newMinutes.toString())
  }

  const time = formatTime(totalSeconds)
  const currentMinutes = Math.floor(totalSeconds / 60)

  // Calculate progress for circular indicator (max 60 minutes = full circle)
  const progress = Math.min((totalSeconds / 3600) * 100, 100)
  const circumference = 2 * Math.PI * 88 // radius = 88

  // State-based colors
  const stateColors = {
    idle: {
      ring: 'stroke-gray-200',
      progress: 'stroke-blue-500',
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      glow: '',
    },
    running: {
      ring: 'stroke-blue-100',
      progress: 'stroke-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    },
    paused: {
      ring: 'stroke-amber-100',
      progress: 'stroke-amber-500',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    },
  }

  const colors = stateColors[timerState]

  return (
    <Card className="bg-white/90 backdrop-blur-sm transition-all hover:shadow-md overflow-hidden">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
            timerState === 'running' ? 'bg-blue-100' : timerState === 'paused' ? 'bg-amber-100' : 'bg-gray-100'
          )}>
            <Clock className={cn(
              "h-5 w-5 transition-colors duration-300",
              timerState === 'running' ? 'text-blue-600' : timerState === 'paused' ? 'text-amber-600' : 'text-gray-600'
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Personal Prayer Time</h3>
            <p className="text-sm text-gray-500">Track your meditation and prayer</p>
          </div>
        </div>

        {/* Circular Timer Display */}
        <div className="flex justify-center my-8">
          <div className={cn(
            "relative w-52 h-52 rounded-full transition-all duration-500",
            colors.bg,
            colors.glow
          )}>
            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
              {/* Background Ring */}
              <circle
                cx="104"
                cy="104"
                r="88"
                fill="none"
                strokeWidth="8"
                className={cn("transition-colors duration-300", colors.ring)}
              />
              {/* Progress Ring */}
              <circle
                cx="104"
                cy="104"
                r="88"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={cn("transition-all duration-300", colors.progress)}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: circumference - (progress / 100) * circumference,
                }}
              />
            </svg>

            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn(
                "flex items-baseline font-mono transition-colors duration-300",
                colors.text
              )}>
                <span className="text-5xl font-bold tracking-tight">{time.minutes}</span>
                <span className={cn(
                  "text-3xl font-bold mx-1",
                  timerState === 'running' && "animate-pulse"
                )}>:</span>
                <span className="text-5xl font-bold tracking-tight">{time.seconds}</span>
              </div>
              
              {/* State Label */}
              <div className={cn(
                "mt-2 text-sm font-medium uppercase tracking-wider transition-colors duration-300",
                timerState === 'idle' && "text-gray-400",
                timerState === 'running' && "text-blue-500",
                timerState === 'paused' && "text-amber-500"
              )}>
                {timerState === 'idle' && 'Ready'}
                {timerState === 'running' && (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    Running
                  </span>
                )}
                {timerState === 'paused' && 'Paused'}
              </div>
            </div>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center gap-3">
          {timerState === 'running' ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handlePause}
              disabled={disabled}
              className="gap-2 border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-all duration-200"
            >
              <Pause className="h-5 w-5" />
              Pause
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={handleStart}
              disabled={disabled}
              className="gap-2 bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105"
            >
              <Play className="h-5 w-5" />
              {timerState === 'paused' ? 'Resume' : 'Start'}
            </Button>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleReset}
            disabled={disabled || (timerState === 'idle' && totalSeconds === 0)}
            className="gap-2 transition-all duration-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="h-5 w-5" />
            Reset
          </Button>
        </div>

        {/* Manual Input & Quick Add */}
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="manual-minutes" className="text-sm text-gray-600 whitespace-nowrap">
              Set minutes:
            </Label>
            <Input
              id="manual-minutes"
              type="number"
              min="0"
              max="1440"
              value={manualInput}
              onChange={(e) => handleManualChange(e.target.value)}
              disabled={disabled || timerState === 'running'}
              className="w-20 text-center font-mono"
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {[5, 10, 15, 30, 60].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addMinutes(amount)}
                disabled={disabled || timerState === 'running'}
                className="transition-all duration-200 hover:scale-105"
              >
                +{amount}m
              </Button>
            ))}
          </div>
        </div>

        {/* Points Display */}
        {currentMinutes > 0 && (
          <div className={cn(
            "mt-6 rounded-xl p-4 text-center transition-all duration-300",
            timerState === 'running' ? 'bg-blue-100' : timerState === 'paused' ? 'bg-amber-100' : 'bg-gradient-to-r from-blue-50 to-purple-50'
          )}>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🙏</span>
              <div>
                <span className={cn(
                  "text-2xl font-bold",
                  timerState === 'running' ? 'text-blue-700' : timerState === 'paused' ? 'text-amber-700' : 'text-gray-900'
                )}>
                  {currentMinutes}
                </span>
                <span className="text-gray-600 ml-1">
                  minute{currentMinutes !== 1 ? 's' : ''} = 
                </span>
                <span className="text-green-600 font-bold ml-1">
                  +{currentMinutes} pts
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
