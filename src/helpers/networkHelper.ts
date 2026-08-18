import { Page, Route } from '@playwright/test';
import { Logger } from '../core/logger/logger.js';

export class NetworkHelper {
  private page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('NetworkHelper');
  }

  /**
   * Mocks a specific URL pattern with a mock JSON response and status code
   */
  async mockJsonResponse(
    urlPattern: string | RegExp,
    mockData: unknown,
    status: number = 200
  ): Promise<void> {
    await this.logger.step(`Mock route: ${urlPattern.toString()} -> [${status}]`, async () => {
      await this.page.route(urlPattern, async (route: Route) => {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: JSON.stringify(mockData),
        });
      });
    });
  }

  /**
   * Simulates a network failure (e.g., abort, timeout, connection reset)
   */
  async simulateNetworkFailure(
    urlPattern: string | RegExp,
    errorCode: 'failed' | 'aborted' | 'timedout' | 'connectionreset' = 'failed'
  ): Promise<void> {
    await this.logger.step(
      `Simulate network failure [${errorCode}] on ${urlPattern.toString()}`,
      async () => {
        await this.page.route(urlPattern, async (route: Route) => {
          await route.abort(errorCode);
        });
      }
    );
  }

  /**
   * Introduces artificial latency/delay to simulate slow network conditions
   */
  async delayRoute(urlPattern: string | RegExp, delayMs: number = 2000): Promise<void> {
    await this.logger.step(`Add ${delayMs}ms delay on ${urlPattern.toString()}`, async () => {
      await this.page.route(urlPattern, async (route: Route) => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        await route.continue();
      });
    });
  }

  /**
   * Blocks external tracking/analytics scripts to speed up test execution
   */
  async blockAnalyticsAndAds(): Promise<void> {
    const blockedDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'doubleclick.net',
      'facebook.net',
      'adnxs.com',
    ];

    await this.page.route(
      (url) => blockedDomains.some((domain) => url.hostname.includes(domain)),
      (route) => route.abort()
    );
  }

  /**
   * Removes all route intercepts
   */
  async unrouteAll(): Promise<void> {
    await this.page.unrouteAll();
  }
}
