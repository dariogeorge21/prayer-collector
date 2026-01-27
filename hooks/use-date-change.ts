import { useState, useEffect } from 'react'

/**
 * Hook to detect when the date changes
 * @param onDateChange - Callback function to call when date changes
 * @param checkIntervalMs - How often to check for date changes (default: 60000ms = 1 minute)
 */
export function useDateChangeDetection(
  onDateChange?: (newDate: string, oldDate: string) => void,
  checkIntervalMs: number = 60000
) {
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = new Date().toISOString().split('T')[0]
      if (newDate !== currentDate) {
        const oldDate = currentDate
        setCurrentDate(newDate)
        onDateChange?.(newDate, oldDate)
      }
    }, checkIntervalMs)

    return () => clearInterval(interval)
  }, [currentDate, onDateChange, checkIntervalMs])

  return currentDate
}
