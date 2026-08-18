import crypto from 'crypto';

/**
 * Utility functions for text manipulation, random string generation, and token parsing.
 */
export class StringUtils {
  /**
   * Generates a random alphanumeric string with a specified length
   */
  static randomString(length: number = 8): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Generates a unique test email address with a timestamp
   */
  static randomEmail(prefix: string = 'testuser'): string {
    const unique = `${Date.now()}_${this.randomString(4)}`;
    return `${prefix}_${unique}@framework.test`;
  }

  /**
   * Generates a secure random password satisfying standard password policies
   */
  static randomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = 'Aa1!';
    for (let i = 4; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  /**
   * Masks sensitive strings (tokens, passwords) for safe logging
   */
  static mask(text: string, visibleStart: number = 2, visibleEnd: number = 2): string {
    if (!text || text.length <= visibleStart + visibleEnd) return '****';
    const start = text.slice(0, visibleStart);
    const end = text.slice(text.length - visibleEnd);
    return `${start}${'*'.repeat(text.length - (visibleStart + visibleEnd))}${end}`;
  }
}
