/**
 * Utility functions for date formatting, calculation, and timestamp manipulation.
 */
export class DateUtils {
  /**
   * Returns the current date in ISO format (YYYY-MM-DD)
   */
  static getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Returns the current timestamp in milliseconds
   */
  static getTimestamp(): number {
    return Date.now();
  }

  /**
   * Returns a formatted timestamp string for unique file names or test run identifiers
   */
  static getFormattedTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  /**
   * Calculates a future or past date offset by days
   */
  static getDateOffset(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  /**
   * Validates if a string is a valid ISO 8601 date string
   */
  static isValidISODate(dateStr: string): boolean {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && dateStr.includes('T');
  }
}
