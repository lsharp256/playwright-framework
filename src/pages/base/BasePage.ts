import { Page, Locator } from '@playwright/test';
import { Logger } from '../../core/logger/logger.js';
import { ENV } from '../../../config/env.config.js';

export abstract class BasePage {
  readonly page: Page;
  protected logger: Logger;
  readonly path: string;

  constructor(page: Page, path: string = '') {
    this.page = page;
    this.path = path;
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Navigates to the page relative path or absolute URL
   */
  async navigate(customPath?: string): Promise<void> {
    const target = customPath !== undefined ? customPath : this.path;
    await this.logger.step(`Navigate to ${target}`, async () => {
      await this.page.goto(target, {
        waitUntil: 'domcontentloaded',
        timeout: ENV.DEFAULT_TIMEOUT,
      });
    });
  }

  /**
   * Returns a Locator for a selector string or returns the locator itself
   */
  getLocator(selectorOrLocator: string | Locator): Locator {
    return typeof selectorOrLocator === 'string'
      ? this.page.locator(selectorOrLocator)
      : selectorOrLocator;
  }

  /**
   * Clicks on an element after ensuring it is visible and enabled
   */
  async click(selectorOrLocator: string | Locator, description?: string): Promise<void> {
    const locator = this.getLocator(selectorOrLocator);
    const label =
      description || (typeof selectorOrLocator === 'string' ? selectorOrLocator : 'element');
    await this.logger.step(`Click "${label}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
      await locator.click();
    });
  }

  /**
   * Fills an input field with clear and text input
   */
  async fill(
    selectorOrLocator: string | Locator,
    value: string,
    description?: string
  ): Promise<void> {
    const locator = this.getLocator(selectorOrLocator);
    const label =
      description || (typeof selectorOrLocator === 'string' ? selectorOrLocator : 'input');
    await this.logger.step(`Fill "${label}" with value`, async () => {
      await locator.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
      await locator.fill(value);
    });
  }

  /**
   * Types text into an element with keypress simulation
   */
  async type(
    selectorOrLocator: string | Locator,
    value: string,
    delay: number = 50,
    description?: string
  ): Promise<void> {
    const locator = this.getLocator(selectorOrLocator);
    const label =
      description || (typeof selectorOrLocator === 'string' ? selectorOrLocator : 'input');
    await this.logger.step(`Type into "${label}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
      await locator.pressSequentially(value, { delay });
    });
  }

  /**
   * Retrieves text content of an element
   */
  async getText(selectorOrLocator: string | Locator): Promise<string> {
    const locator = this.getLocator(selectorOrLocator);
    await locator.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
    return (await locator.innerText()).trim();
  }

  /**
   * Checks if an element is currently visible
   */
  async isVisible(selectorOrLocator: string | Locator): Promise<boolean> {
    const locator = this.getLocator(selectorOrLocator);
    return await locator.isVisible();
  }

  /**
   * Selects an option in a `<select>` dropdown
   */
  async selectOption(
    selectorOrLocator: string | Locator,
    valueOrLabel: string,
    description?: string
  ): Promise<void> {
    const locator = this.getLocator(selectorOrLocator);
    const label = description || 'dropdown';
    await this.logger.step(`Select "${valueOrLabel}" in "${label}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
      await locator.selectOption({ label: valueOrLabel });
    });
  }

  /**
   * Sets checkbox or radio button state to checked
   */
  async check(selectorOrLocator: string | Locator, description?: string): Promise<void> {
    const locator = this.getLocator(selectorOrLocator);
    const label = description || 'checkbox';
    await this.logger.step(`Check "${label}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: ENV.EXPECT_TIMEOUT });
      await locator.check();
    });
  }

  /**
   * Waits for an element to become visible
   */
  async waitForVisible(selectorOrLocator: string | Locator, timeoutMs?: number): Promise<Locator> {
    const locator = this.getLocator(selectorOrLocator);
    await locator.waitFor({ state: 'visible', timeout: timeoutMs || ENV.EXPECT_TIMEOUT });
    return locator;
  }

  /**
   * Waits for an element to be hidden or detached
   */
  async waitForHidden(selectorOrLocator: string | Locator, timeoutMs?: number): Promise<void> {
    const locator = this.getLocator(selectorOrLocator);
    await locator.waitFor({ state: 'hidden', timeout: timeoutMs || ENV.EXPECT_TIMEOUT });
  }

  /**
   * Takes a full page screenshot and returns buffer
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.logger.step(`Take Screenshot: ${name}`, async () => {
      return await this.page.screenshot({
        path: `test-results/screenshots/${name}_${Date.now()}.png`,
        fullPage: true,
      });
    });
  }

  /**
   * Waits for network to be idle
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Returns current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Returns document title
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
}
