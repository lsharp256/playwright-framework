import { Locator, Page } from '@playwright/test';
import { Logger } from '../../core/logger/logger.js';
import { ENV } from '../../../config/env.config.js';

export abstract class BaseComponent {
  readonly root: Locator;
  readonly page: Page;
  protected logger: Logger;

  constructor(root: Locator, page: Page) {
    this.root = root;
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Resolves child locator relative to this component's root
   */
  protected getChild(selectorOrLocator: string | Locator): Locator {
    return typeof selectorOrLocator === 'string'
      ? this.root.locator(selectorOrLocator)
      : selectorOrLocator;
  }

  /**
   * Checks if this component is visible on the page
   */
  async isVisible(): Promise<boolean> {
    return await this.root.isVisible();
  }

  /**
   * Waits for component to be visible
   */
  async waitForVisible(timeoutMs?: number): Promise<Locator> {
    await this.root.waitFor({ state: 'visible', timeout: timeoutMs || ENV.EXPECT_TIMEOUT });
    return this.root;
  }

  /**
   * Clicks a child element inside component
   */
  async clickChild(selector: string, description?: string): Promise<void> {
    const target = this.getChild(selector);
    await this.logger.step(`Click component element "${description || selector}"`, async () => {
      await target.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
      await target.click();
    });
  }

  /**
   * Retrieves text of a child element inside component
   */
  async getChildText(selector: string): Promise<string> {
    const target = this.getChild(selector);
    await target.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
    return (await target.innerText()).trim();
  }
}
