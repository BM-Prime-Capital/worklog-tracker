/**
 * Utility functions for time formatting and calculations
 */

/**
 * Formats hours in decimal format to human-readable format (e.g., 11.87 -> 11h52m)
 * @param hours - Hours in decimal format
 * @returns Formatted string like "11h52m" or "0h30m"
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h${minutes.toString().padStart(2, '0')}m`
}

/**
 * Rounds hours to the nearest whole number for display purposes
 * @param hours - Hours in decimal format
 * @returns Rounded hours as integer
 */
export function roundHours(hours: number): number {
  return Math.round(hours)
}

/**
 * Formats hours for display in stats cards (shows decimal if needed, otherwise whole number)
 * @param hours - Hours in decimal format
 * @returns Formatted string for stats display
 */
export function formatHoursForStats(hours: number): string {
  if (hours === 0) return '0'
  
  // If it's a whole number, show without decimal
  if (hours % 1 === 0) {
    return hours.toString()
  }
  
  // Otherwise, show with one decimal place
  return hours.toFixed(1)
}

/**
 * Converts time spent string (like "1h 30m") to decimal hours
 * @param timeSpent - Time spent string from Jira
 * @returns Hours in decimal format
 */
export function parseTimeSpent(timeSpent: string): number {
  if (!timeSpent) return 0
  
  let totalHours = 0
  
  // Match patterns like "1h 30m", "2h", "45m", etc.
  const hourMatch = timeSpent.match(/(\d+)h/)
  const minuteMatch = timeSpent.match(/(\d+)m/)
  
  if (hourMatch) {
    totalHours += parseInt(hourMatch[1])
  }
  
  if (minuteMatch) {
    totalHours += parseInt(minuteMatch[1]) / 60
  }
  
  return totalHours
}

/**
 * Converts seconds to decimal hours
 * @param seconds - Time in seconds
 * @returns Hours in decimal format
 */
export function secondsToHours(seconds: number): number {
  return seconds / 3600
}

/**
 * Converts decimal hours to seconds
 * @param hours - Hours in decimal format
 * @returns Time in seconds
 */
export function hoursToSeconds(hours: number): number {
  return hours * 3600
}

/**
 * Formats time from seconds to human-readable format (e.g., 3600 -> 1h, 3900 -> 1h5m)
 * @param seconds - Time in seconds
 * @returns Formatted string like "1h5m" or "30m"
 */
export function formatTimeFromSeconds(seconds: number): string {
  if (seconds === 0) return '0m'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  
  if (hours === 0) {
    return `${minutes}m`
  }
  
  if (minutes === 0) {
    return `${hours}h`
  }
  
  return `${hours}h${minutes.toString().padStart(2, '0')}m`
}