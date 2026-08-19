import { Page } from '@playwright/test';

export interface PagePerformanceMetrics {
  ttfbMs: number;
  domContentLoadedMs: number;
  loadEventMs: number;
  dnsMs: number;
  tcpMs: number;
}

export class BrowserLoadHelper {
  /**
   * Extracts Navigation Timing API metrics from the current page state
   */
  static async extractNavigationMetrics(page: Page): Promise<PagePerformanceMetrics> {
    try {
      const timings = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!nav) {
          const timing = performance.timing;
          return {
            ttfbMs: Math.max(0, Math.round(timing.responseStart - timing.requestStart)),
            domContentLoadedMs: Math.max(
              0,
              Math.round(timing.domContentLoadedEventEnd - timing.navigationStart)
            ),
            loadEventMs: Math.max(0, Math.round(timing.loadEventEnd - timing.navigationStart)),
            dnsMs: Math.max(0, Math.round(timing.domainLookupEnd - timing.domainLookupStart)),
            tcpMs: Math.max(0, Math.round(timing.connectEnd - timing.connectStart)),
          };
        }

        return {
          ttfbMs: Math.max(0, Math.round(nav.responseStart - nav.requestStart)),
          domContentLoadedMs: Math.max(0, Math.round(nav.domContentLoadedEventEnd)),
          loadEventMs: Math.max(0, Math.round(nav.loadEventEnd)),
          dnsMs: Math.max(0, Math.round(nav.domainLookupEnd - nav.domainLookupStart)),
          tcpMs: Math.max(0, Math.round(nav.connectEnd - nav.connectStart)),
        };
      });

      return timings;
    } catch {
      return {
        ttfbMs: 0,
        domContentLoadedMs: 0,
        loadEventMs: 0,
        dnsMs: 0,
        tcpMs: 0,
      };
    }
  }
}
