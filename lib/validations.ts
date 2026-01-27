import { z } from 'zod'

// User validation schema
export const userNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )
  .trim()

export const userEmailSchema = z
  .string()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''))

export const createUserSchema = z.object({
  name: userNameSchema,
  email: userEmailSchema,
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// Daily entry validation schema
export const prayerTimeSchema = z
  .number()
  .int('Prayer time must be a whole number')
  .min(0, 'Prayer time cannot be negative')
  .max(1440, 'Prayer time cannot exceed 24 hours (1440 minutes)')

export const dailyEntrySchema = z.object({
  rosary_completed: z.boolean(),
  holy_mass_attended: z.boolean(),
  prayer_time_minutes: prayerTimeSchema,
})

// Validation helper to check if entry has any data
export const hasEntryData = (entry: z.infer<typeof dailyEntrySchema>): boolean => {
  return (
    entry.rosary_completed ||
    entry.holy_mass_attended ||
    entry.prayer_time_minutes > 0
  )
}

export type DailyEntryInput = z.infer<typeof dailyEntrySchema>

// Date validation
export const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

// Validation result type
export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Validate daily entry
export const validateDailyEntry = (
  input: DailyEntryInput
): ValidationResult<DailyEntryInput> => {
  try {
    const validated = dailyEntrySchema.parse(input)
    
    // Check if entry has any data
    if (!hasEntryData(validated)) {
      return {
        success: false,
        error: 'Please complete at least one activity before saving',
      }
    }
    
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: 'Invalid entry data' }
  }
}

// Validate user creation
export const validateUser = (
  input: CreateUserInput
): ValidationResult<CreateUserInput> => {
  try {
    const validated = createUserSchema.parse(input)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return { success: false, error: firstError.message }
    }
    return { success: false, error: 'Invalid user data' }
  }
}
