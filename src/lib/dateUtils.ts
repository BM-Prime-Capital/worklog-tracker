/**
 * Utility functions for date handling to avoid timezone issues
 */

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone
 * This avoids the timezone shift issues that occur with toISOString()
 */
export function formatDateLocal(date: Date): string {
  return date.getFullYear() + '-' + 
    String(date.getMonth() + 1).padStart(2, '0') + '-' + 
    String(date.getDate()).padStart(2, '0')
}

/**
 * Formats a Date object to HH:MM string using local timezone
 */
export function formatTimeLocal(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

/**
 * Gets the current date in YYYY-MM-DD format using local timezone
 */
export function getCurrentDateLocal(): string {
  return formatDateLocal(new Date())
}

/**
 * Gets a date N days ago in YYYY-MM-DD format using local timezone
 */
export function getDateDaysAgoLocal(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return formatDateLocal(date)
}
