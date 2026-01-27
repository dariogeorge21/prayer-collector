/**
 * Validation Examples and Test Cases
 * 
 * This file demonstrates the validation rules for the Faith Tracker app
 */

import { 
  validateDailyEntry, 
  validateUser, 
  prayerTimeSchema,
  userNameSchema 
} from './validations'
import { z } from 'zod'

// ==================== DAILY ENTRY VALIDATION ====================

console.log('\n=== Daily Entry Validation Examples ===\n')

// ✅ Valid entry
const validEntry = validateDailyEntry({
  rosary_completed: true,
  holy_mass_attended: false,
  prayer_time_minutes: 30,
})
console.log('Valid entry:', validEntry)

// ❌ Empty entry (no activities)
const emptyEntry = validateDailyEntry({
  rosary_completed: false,
  holy_mass_attended: false,
  prayer_time_minutes: 0,
})
console.log('Empty entry:', emptyEntry)

// ❌ Prayer time exceeds maximum (1440 minutes = 24 hours)
try {
  prayerTimeSchema.parse(1500)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Prayer time too high:', error.issues[0].message)
  }
}

// ❌ Negative prayer time
try {
  prayerTimeSchema.parse(-10)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Negative prayer time:', error.issues[0].message)
  }
}

// ✅ Maximum valid prayer time
const maxEntry = validateDailyEntry({
  rosary_completed: true,
  holy_mass_attended: true,
  prayer_time_minutes: 1440,
})
console.log('Max prayer time entry:', maxEntry)

// ==================== USER NAME VALIDATION ====================

console.log('\n=== User Name Validation Examples ===\n')

// ✅ Valid names
const validNames = [
  "John Doe",
  "Mary-Anne O'Brien",
  "José María",
  "St. Francis",
  "Anne-Marie"
]

validNames.forEach(name => {
  try {
    userNameSchema.parse(name)
    console.log(`✅ "${name}" - Valid`)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(`❌ "${name}" - ${error.issues[0].message}`)
    }
  }
})

// ❌ Invalid names
const invalidNames = [
  "A", // Too short
  "John123", // Contains numbers
  "John@Doe", // Special characters
  "John_Doe", // Underscore
  "A".repeat(51), // Too long (>50 chars)
]

console.log('\nInvalid names:')
invalidNames.forEach(name => {
  try {
    userNameSchema.parse(name)
    console.log(`✅ "${name}" - Valid`)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(`❌ "${name.substring(0, 20)}..." - ${error.issues[0].message}`)
    }
  }
})

// ==================== USER CREATION VALIDATION ====================

console.log('\n=== User Creation Validation Examples ===\n')

// ✅ Valid user with email
const validUser1 = validateUser({
  name: "John Smith",
  email: "john@example.com",
})
console.log('Valid user with email:', validUser1)

// ✅ Valid user without email
const validUser2 = validateUser({
  name: "Mary Jones",
  email: "",
})
console.log('Valid user without email:', validUser2)

// ❌ Invalid email
const invalidUser = validateUser({
  name: "Bob Brown",
  email: "invalid-email",
})
console.log('Invalid email:', invalidUser)

// ❌ Name too short
const shortName = validateUser({
  name: "J",
  email: "",
})
console.log('Name too short:', shortName)

// ==================== EDGE CASES ====================

console.log('\n=== Edge Cases ===\n')

// Decimal prayer time (should be rounded down)
console.log('Decimal prayer time (45.7):')
try {
  prayerTimeSchema.parse(45.7)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Error:', error.issues[0].message)
  }
}

// Leading/trailing spaces in name (should be trimmed)
console.log('\nName with spaces:')
const trimmedUser = validateUser({
  name: "  John Doe  ",
  email: "",
})
console.log('Trimmed name:', trimmedUser)

// Multiple spaces in name
console.log('\nMultiple spaces:')
try {
  userNameSchema.parse("John    Doe")
  console.log('✅ Multiple spaces allowed')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('❌ Error:', error.issues[0].message)
  }
}
