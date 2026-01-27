'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface HolyMassCheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function HolyMassCheckbox({ 
  checked, 
  onCheckedChange, 
  disabled 
}: HolyMassCheckboxProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-2xl">
            ⛪
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Label 
                  htmlFor="mass" 
                  className="text-lg font-semibold text-gray-900 cursor-pointer"
                >
                  Holy Mass
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Did you attend Mass today?
                </p>
              </div>
              
              <Checkbox
                id="mass"
                checked={checked}
                onCheckedChange={(value) => onCheckedChange(value === true)}
                disabled={disabled}
                className="h-6 w-6 rounded-md"
              />
            </div>
          </div>
        </div>
        
        {checked && (
          <div className="mt-4 rounded-lg bg-purple-50 p-3 text-sm text-purple-800">
            🙏 Blessed! The Eucharist is the source of grace. +15 points
          </div>
        )}
      </CardContent>
    </Card>
  )
}
