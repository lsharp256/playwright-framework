import { Locator, Page, expect } from '@playwright/test';
import { Logger } from '../core/logger/logger.js';

export interface VisualComparisonOptions {
  mask?: (string | Locator)[];
  maxDiffPixelRatio?: number;
  threshold?: number;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
}

export class VisualHelper {
  private page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('VisualHelper');
  }

  /**
   * Compares the entire page against a baseline snapshot
   */
  async comparePageSnapshot(
    snapshotName: string,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    const { mask = [], maxDiffPixelRatio = 0.05, threshold = 0.2, fullPage = true, clip } = options;

    await this.logger.step(`Visual Snapshot: "${snapshotName}"`, async () => {
      const maskLocators = mask.map((item) =>
        typeof item === 'string' ? this.page.locator(item) : item
      );

      await expect(this.page).toHaveScreenshot(snapshotName, {
        mask: maskLocators,
        maxDiffPixelRatio,
        threshold,
        fullPage,
        clip,
        animations: 'disabled',
      });
    });
  }

  /**
   * Compares a specific UI component / locator against a baseline snapshot
   */
  async compareElementSnapshot(
    locator: Locator,
    snapshotName: string,
    options: Omit<VisualComparisonOptions, 'fullPage' | 'clip'> = {}
  ): Promise<void> {
    const { mask = [], maxDiffPixelRatio = 0.05, threshold = 0.2 } = options;

    await this.logger.step(`Element Visual Snapshot: "${snapshotName}"`, async () => {
      const maskLocators = mask.map((item) =>
        typeof item === 'string' ? this.page.locator(item) : item
      );

      await expect(locator).toHaveScreenshot(snapshotName, {
        mask: maskLocators,
        maxDiffPixelRatio,
        threshold,
        animations: 'disabled',
      });
    });
  }
}
