import { formatInTimeZone, toDate } from 'date-fns-tz'

const TIMEZONE = 'Africa/Lagos'

export function getDateRange(dateFilter: string): { start: string, end: string } | null {
  const now = new Date()
  
  // Get current date string in Lagos timezone (YYYY-MM-DD)
  const todayStr = formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd')
  
  // Parse back as midnight in Lagos timezone
  const todayStart = toDate(`${todayStr}T00:00:00`, { timeZone: TIMEZONE })
  const todayEnd = toDate(`${todayStr}T23:59:59.999`, { timeZone: TIMEZONE })
  
  const msPerDay = 24 * 60 * 60 * 1000

  switch (dateFilter) {
    case 'today':
      return { start: todayStart.toISOString(), end: todayEnd.toISOString() }
    
    case 'yesterday': {
      const start = new Date(todayStart.getTime() - msPerDay)
      const end = new Date(todayEnd.getTime() - msPerDay)
      return { start: start.toISOString(), end: end.toISOString() }
    }
    
    case '7d': {
      const start = new Date(todayStart.getTime() - (6 * msPerDay))
      return { start: start.toISOString(), end: todayEnd.toISOString() }
    }
    
    case '30d': {
      const start = new Date(todayStart.getTime() - (29 * msPerDay))
      return { start: start.toISOString(), end: todayEnd.toISOString() }
    }
    
    case 'this_month': {
      const monthStr = formatInTimeZone(now, TIMEZONE, 'yyyy-MM')
      const start = toDate(`${monthStr}-01T00:00:00`, { timeZone: TIMEZONE })
      return { start: start.toISOString(), end: todayEnd.toISOString() }
    }
    
    case 'last_month': {
      // Find the first day of this month, then subtract 1 day to get last month
      const thisMonthStr = formatInTimeZone(now, TIMEZONE, 'yyyy-MM')
      const thisMonthStart = toDate(`${thisMonthStr}-01T00:00:00`, { timeZone: TIMEZONE })
      
      const lastMonthEnd = new Date(thisMonthStart.getTime() - 1)
      const lastMonthStr = formatInTimeZone(lastMonthEnd, TIMEZONE, 'yyyy-MM')
      const lastMonthStart = toDate(`${lastMonthStr}-01T00:00:00`, { timeZone: TIMEZONE })
      
      return { start: lastMonthStart.toISOString(), end: lastMonthEnd.toISOString() }
    }
    
    case 'this_year': {
      const yearStr = formatInTimeZone(now, TIMEZONE, 'yyyy')
      const start = toDate(`${yearStr}-01-01T00:00:00`, { timeZone: TIMEZONE })
      return { start: start.toISOString(), end: todayEnd.toISOString() }
    }
    
    default:
      return null
  }
}
