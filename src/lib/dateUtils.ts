/**
 * Date and Timezone Utilities for HomeOS
 * Ensures data is stored in UTC ISO format while grouping and displaying
 * in the user's/business's local timezone.
 */

export function getUserTimeZone(): string {
  if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }
  return 'UTC'
}

/**
 * Converts a local date string (e.g. '2026-09-29' from an <input type="date">)
 * or Date object to a UTC ISO string ('YYYY-MM-DDTHH:mm:ss.sssZ').
 */
export function toUTCISOString(dateInput?: string | Date | null): string {
  if (!dateInput) {
    return new Date().toISOString()
  }

  if (dateInput instanceof Date) {
    return dateInput.toISOString()
  }

  // If already an ISO string with time
  if (typeof dateInput === 'string' && dateInput.includes('T')) {
    const d = new Date(dateInput)
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }

  // If it's a date-only string like 'YYYY-MM-DD'
  const parts = dateInput.split('-').map(Number)
  if (parts.length === 3) {
    const [year, month, day] = parts
    // Interpret as local calendar day and convert to UTC
    const localDate = new Date(year, month - 1, day, 12, 0, 0)
    return localDate.toISOString()
  }

  const parsed = new Date(dateInput)
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

/**
 * Returns 'YYYY-MM' period key for a given date in the specified (or local) timezone.
 */
export function getPeriodKey(dateInput: string | Date | null | undefined, timeZone?: string): string {
  if (!dateInput) return getCurrentPeriodKey(timeZone)

  const tz = timeZone || getUserTimeZone()
  let dateObj: Date

  if (dateInput instanceof Date) {
    dateObj = dateInput
  } else if (typeof dateInput === 'string') {
    // If it's a simple 'YYYY-MM-DD' string without time, parse components
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [y, m, d] = dateInput.split('-').map(Number)
      dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    } else {
      dateObj = new Date(dateInput)
    }
  } else {
    dateObj = new Date()
  }

  if (isNaN(dateObj.getTime())) {
    return getCurrentPeriodKey(timeZone)
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
    })
    // en-CA produces YYYY-MM
    return formatter.format(dateObj).substring(0, 7)
  } catch {
    // Fallback if timezone string is invalid
    const y = dateObj.getUTCFullYear()
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }
}

/**
 * Returns current period key 'YYYY-MM' in the given timezone.
 */
export function getCurrentPeriodKey(timeZone?: string): string {
  const tz = timeZone || getUserTimeZone()
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
    })
    return formatter.format(new Date()).substring(0, 7)
  } catch {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }
}

/**
 * Formats a date for human display in local timezone (e.g. "29 sept 2026").
 */
export function formatLocalDate(
  dateInput: string | Date | null | undefined,
  timeZone?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '-'
  const tz = timeZone || getUserTimeZone()
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(d.getTime())) return String(dateInput)

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: tz,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }

  try {
    return new Intl.DateTimeFormat('es-AR', defaultOptions).format(d)
  } catch {
    return d.toLocaleDateString()
  }
}

export interface MonthDescriptor {
  key: string // 'YYYY-MM'
  label: string // 'Septiembre 2026'
  shortLabel: string // 'Sep 26'
  year: number
  month: number // 1-12
}

/**
 * Returns the last N months ending at referenceDate in the target timezone.
 */
export function getLastNMonths(count = 6, referenceDate = new Date(), timeZone?: string): MonthDescriptor[] {
  const tz = timeZone || getUserTimeZone()
  const result: MonthDescriptor[] = []

  // Get current year and month in target timezone
  const currentKey = getCurrentPeriodKey(tz)
  const [currY, currM] = currentKey.split('-').map(Number)

  for (let i = 0; i < count; i++) {
    let year = currY
    let month = currM - i
    while (month <= 0) {
      month += 12
      year -= 1
    }

    const key = `${year}-${String(month).padStart(2, '0')}`
    const dateForFormatting = new Date(Date.UTC(year, month - 1, 15))

    const labelFormatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    })
    const shortFormatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: 'UTC',
      month: 'short',
      year: '2-digit',
    })

    const rawLabel = labelFormatter.format(dateForFormatting)
    // Capitalize first letter
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1)
    const shortLabel = shortFormatter.format(dateForFormatting)

    result.push({
      key,
      label,
      shortLabel,
      year,
      month,
    })
  }

  return result
}

/**
 * Returns formatted month label for a 'YYYY-MM' key.
 */
export function formatPeriodLabel(periodKey: string): string {
  const [y, m] = periodKey.split('-').map(Number)
  if (!y || !m) return periodKey
  const d = new Date(Date.UTC(y, m - 1, 15))
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  })
  const str = formatter.format(d)
  return str.charAt(0).toUpperCase() + str.slice(1)
}
