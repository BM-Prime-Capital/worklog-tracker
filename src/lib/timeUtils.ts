/**
 * Utility functions for time formatting and calculations
 */

/**
 * Formats seconds into a human-readable time format (e.g., "2h 30m", "45m", "1h")
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTimeFromSeconds(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  } else if (minutes === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${minutes}m`
  }
}

/**
 * Formats hours (decimal) into a human-readable time format (e.g., "2h 30m", "45m", "1h")
 * @param hours - Time in hours (can be decimal)
 * @returns Formatted time string
 */
export function formatTimeFromHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const wholeHours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (wholeHours === 0) {
    return `${minutes}m`
  } else if (minutes === 0) {
    return `${wholeHours}h`
  } else {
    return `${wholeHours}h ${minutes}m`
  }
}

/**
 * Converts seconds to hours (decimal)
 * @param seconds - Time in seconds
 * @returns Time in hours
 */
export function secondsToHours(seconds: number): number {
  return seconds / 3600
}

/**
 * Converts hours to seconds
 * @param hours - Time in hours
 * @returns Time in seconds
 */
export function hoursToSeconds(hours: number): number {
  return hours * 3600
}
