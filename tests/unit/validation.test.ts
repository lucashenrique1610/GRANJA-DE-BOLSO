import { describe, it, expect } from 'vitest'
import { validateDate, formatDateInput } from '../../lib/date-utils'

describe('Date Validation', () => {
  it('should validate correct dates', () => {
    const today = new Date()
    const validDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
    expect(validateDate(validDate)).toBe(true)
  })

  it('should invalidate future dates by default', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const invalidDate = `${String(futureDate.getDate()).padStart(2, '0')}/${String(futureDate.getMonth() + 1).padStart(2, '0')}/${futureDate.getFullYear()}`
    expect(validateDate(invalidDate)).toBe(false)
  })

  it('should invalidate incorrect formats', () => {
    expect(validateDate('2023-01-01')).toBe(false)
    expect(validateDate('01-01-2023')).toBe(false)
    expect(validateDate('invalid')).toBe(false)
  })

  it('should invalidate non-existent dates', () => {
    expect(validateDate('31/02/2023')).toBe(false) // Feb 31st
  })
})

describe('Date Formatting', () => {
  it('should format input correctly', () => {
    expect(formatDateInput('01012023')).toBe('01/01/2023')
    expect(formatDateInput('01')).toBe('01')
    expect(formatDateInput('010')).toBe('01/0')
  })
})
