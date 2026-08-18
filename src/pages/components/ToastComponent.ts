import { Locator, Page } from '@playwright/test';
import { BaseComponent } from '../base/BaseComponent.js';

export class ToastComponent extends BaseComponent {
  readonly message: Locator;
  readonly closeBtn: Locator;

  constructor(page: Page, rootSelector: string = '.toast, .alert, .notification, [role="alert"]') {
    super(page.locator(rootSelector).first(), page);
    this.message = this.getChild('.toast-message, .alert-text, span, p');
    this.closeBtn = this.getChild('button.close, [aria-label="Close"]');
  }

  async getMessage(): Promise<string> {
    return (await this.root.innerText()).trim();
  }

  async dismiss(): Promise<void> {
    if (await this.closeBtn.isVisible()) {
      await this.closeBtn.click();
    }
  }
}
