'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface ResetDataSectionProps {
  onResetComplete?: () => void
}

export function ResetDataSection({ onResetComplete }: ResetDataSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async () => {
    setIsLoading(true)
    try {
      // Call the reset function
      const { data, error } = await supabase.rpc('reset_all_user_data' as any, {}, { count: 'exact' })

      if (error) {
        console.error('Reset error:', error)
        toast({
          title: 'Error',
          description: error.message || 'Failed to reset user data. Please try again.',
          variant: 'destructive',
        })
        return
      }

      // Show success message
      toast({
        title: 'Success',
        description: `All user data has been reset! ${data || 0} entries were deleted.`,
      })

      // Callback to refresh admin dashboard
      onResetComplete?.()
    } catch (error) {
      console.error('Reset error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Reset All User Data</h3>
            <p className="text-sm text-red-700 mb-4">
              This will delete all daily entries for all users, resetting their scores and streaks to 0. 
              This action cannot be undone. Use this to restart collection every month.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsOpen(true)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Resetting...' : 'Reset All Data'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleReset}
        title="Reset All User Data?"
        description="This will permanently delete all daily entries for all users. Their scores and streaks will be reset to 0. This action cannot be undone."
        confirmText="Reset All Data"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  )
}
