/**
 * Timezone-Aware Date Utilities
 * All dates are handled in Israel timezone (Asia/Jerusalem) with Hebrew formatting
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { he } from 'date-fns/locale';

// Israel timezone
const ISRAEL_TZ = 'Asia/Jerusalem';

/**
 * Format a date in Hebrew locale
 * @param date - Date to format (Date object or ISO string)
 * @param formatStr - Format string (default: 'PPP' for long localized date)
 * @returns Formatted date string in Hebrew
 */
export function formatDateHebrew(date: Date | string, formatStr: string = 'PPP'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return '';
    }

    const zonedDate = utcToZonedTime(dateObj, ISRAEL_TZ);
    return format(zonedDate, formatStr, { locale: he });
  } catch (error) {
    return '';
  }
}

/**
 * Format date for database storage (YYYY-MM-DD in UTC)
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDate(date: Date): string {
  try {
    if (!isValid(date)) {
      return '';
    }

    const zonedDate = utcToZonedTime(date, ISRAEL_TZ);
    return format(zonedDate, 'yyyy-MM-dd');
  } catch (error) {
    return '';
  }
}

/**
 * Format time in 24-hour format (standard in Israel)
 * @param date - Date to format
 * @returns Time string in HH:mm format
 */
export function formatTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return '';
    }

    const zonedDate = utcToZonedTime(dateObj, ISRAEL_TZ);
    return format(zonedDate, 'HH:mm', { locale: he });
  } catch (error) {
    return '';
  }
}

/**
 * Format date and time together
 * @param date - Date to format
 * @returns Formatted date and time string in Hebrew
 */
export function formatDateTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return '';
    }

    const zonedDate = utcToZonedTime(dateObj, ISRAEL_TZ);
    return format(zonedDate, 'PPP HH:mm', { locale: he });
  } catch (error) {
    return '';
  }
}

/**
 * Format relative time in Hebrew (e.g., "לפני 5 דקות")
 * @param date - Date to format
 * @returns Relative time string in Hebrew
 */
export function formatRelative(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return '';
    }

    return formatDistanceToNow(dateObj, { locale: he, addSuffix: true });
  } catch (error) {
    return '';
  }
}

/**
 * Convert local time to UTC for database storage
 * @param date - Local date in Israel timezone
 * @returns UTC Date object
 */
export function toUTC(date: Date): Date {
  try {
    if (!isValid(date)) {
      return new Date();
    }

    return zonedTimeToUtc(date, ISRAEL_TZ);
  } catch (error) {
    return new Date();
  }
}

/**
 * Get current time in Israel timezone
 * @returns Current date in Israel timezone
 */
export function nowInIsrael(): Date {
  return utcToZonedTime(new Date(), ISRAEL_TZ);
}

/**
 * Get start of day in Israel timezone
 * @param date - Optional date (defaults to today)
 * @returns Date set to 00:00:00 in Israel timezone
 */
export function startOfDayIsrael(date?: Date): Date {
  const baseDate = date || new Date();
  const zonedDate = utcToZonedTime(baseDate, ISRAEL_TZ);
  zonedDate.setHours(0, 0, 0, 0);
  return zonedDate;
}

/**
 * Get end of day in Israel timezone
 * @param date - Optional date (defaults to today)
 * @returns Date set to 23:59:59 in Israel timezone
 */
export function endOfDayIsrael(date?: Date): Date {
  const baseDate = date || new Date();
  const zonedDate = utcToZonedTime(baseDate, ISRAEL_TZ);
  zonedDate.setHours(23, 59, 59, 999);
  return zonedDate;
}

/**
 * Check if a date is today in Israel timezone
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return false;
    }

    const today = formatDate(nowInIsrael());
    const checkDate = formatDate(dateObj);

    return today === checkDate;
  } catch (error) {
    return false;
  }
}

/**
 * Parse ISO string to Date in Israel timezone
 * @param isoString - ISO date string from database
 * @returns Date object in Israel timezone
 */
export function parseISOInIsrael(isoString: string): Date {
  try {
    const date = parseISO(isoString);

    if (!isValid(date)) {
      return new Date();
    }

    return utcToZonedTime(date, ISRAEL_TZ);
  } catch (error) {
    return new Date();
  }
}

/**
 * Get Hebrew day name
 * @param date - Date to get day name for
 * @returns Hebrew day name
 */
export function getHebrewDayName(date: Date | string): string {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return '';
    }

    const zonedDate = utcToZonedTime(dateObj, ISRAEL_TZ);
    return days[zonedDate.getDay()];
  } catch (error) {
    return '';
  }
}

/**
 * Get Hebrew month name
 * @param date - Date to get month name for
 * @returns Hebrew month name
 */
export function getHebrewMonthName(date: Date | string): string {
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return '';
    }

    const zonedDate = utcToZonedTime(dateObj, ISRAEL_TZ);
    return months[zonedDate.getMonth()];
  } catch (error) {
    return '';
  }
}

// Re-export the original formatDate and formatDateHebrew for backward compatibility
// Note: These are now timezone-aware
export { formatDate as formatDateForDB, formatDateHebrew as formatDateDisplay };
