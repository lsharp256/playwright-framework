/**
 * Utility functions for asynchronous polling, conditional waiting, and sleep delays.
 */
export class WaitUtils {
  /**
   * Pauses execution for a specified number of milliseconds
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Polls an asynchronous predicate function until it returns true or times out
   */
  static async pollUntil<T>(
    predicate: () => Promise<T | boolean | null | undefined>,
    options: {
      timeoutMs?: number;
      intervalMs?: number;
      timeoutMessage?: string;
    } = {}
  ): Promise<T | boolean> {
    const {
      timeoutMs = 15000,
      intervalMs = 500,
      timeoutMessage = 'Polling condition timed out',
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await predicate();
        if (result) {
          return result;
        }
      } catch {
        // Suppress and continue polling until timeout
      }
      await this.sleep(intervalMs);
    }

    throw new Error(`${timeoutMessage} (after ${timeoutMs}ms)`);
  }
}
