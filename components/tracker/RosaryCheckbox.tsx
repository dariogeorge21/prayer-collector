'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface RosaryCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function RosaryCheckbox({ 
  checked, 
  onCheckedChange, 
  disabled 
}: RosaryCheckboxProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm card-interactive">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl transition-transform duration-300 ${checked ? 'scale-110' : ''}`}>
            📿
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Label 
                  htmlFor="rosary" 
                  className="text-lg font-semibold text-gray-900 cursor-pointer"
                >
                  Holy Rosary
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Did you pray the Rosary today?
                </p>
              </div>
              
              <Checkbox
                id="rosary"
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
                disabled={disabled}
                className="h-6 w-6 rounded-md checkbox-animated transition-all duration-200 data-[state=checked]:animate-check-bounce"
              />
            </div>
          </div>
        </div>
        
        {checked && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 animate-fade-in-up">
            ✨ Wonderful! The Rosary is a powerful prayer. +10 points
          </div>
        )}
      </CardContent>
    </Card>
  )
}
