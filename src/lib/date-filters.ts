import { toDate, formatInTimeZone } from 'date-fns-tz'
import { subDays, startOfMonth, startOfYear } from 'date-fns'

const TIMEZONE = 'Africa/Lagos'

export function getDateRange(filter: string): { start: string, end: string } | null {
  const now = new Date()
  
  // Helper to get the start of the day in Lagos timezone
  const getStartOfDay = (date: Date) => {
    const formatted = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
    return toDate(`${formatted}T00:00:00`, { timeZone: TIMEZONE })
  }

  // Helper to get the end of the day in Lagos timezone
  const getEndOfDay = (date: Date) => {
    const formatted = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
    return toDate(`${formatted}T23:59:59.999`, { timeZone: TIMEZONE })
  }

  switch (filter) {
    case 'today':
      return {
        start: getStartOfDay(now).toISOString(),
        end: getEndOfDay(now).toISOString()
      }
    case 'yesterday': {
      const yesterday = subDays(now, 1)
      return {
        start: getStartOfDay(yesterday).toISOString(),
        end: getEndOfDay(yesterday).toISOString()
      }
    }
    case '7d': {
      const sevenDaysAgo = subDays(now, 7)
      return {
        start: getStartOfDay(sevenDaysAgo).toISOString(),
        end: getEndOfDay(now).toISOString() // Ends today
      }
    }
    case '30d': {
      const thirtyDaysAgo = subDays(now, 30)
      return {
        start: getStartOfDay(thirtyDaysAgo).toISOString(),
        end: getEndOfDay(now).toISOString()
      }
    }
    case 'this_month': {
      const startOfM = startOfMonth(now)
      return {
        start: getStartOfDay(startOfM).toISOString(),
        end: getEndOfDay(now).toISOString()
      }
    }
    case 'this_year': {
      const startOfY = startOfYear(now)
      return {
        start: getStartOfDay(startOfY).toISOString(),
        end: getEndOfDay(now).toISOString()
      }
    }
    default:
      return null
  }
}

