import { Locator, Page } from '@playwright/test';
import { BaseComponent } from '../base/BaseComponent.js';

export class ModalComponent extends BaseComponent {
  readonly title: Locator;
  readonly body: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page, rootSelector: string = '.modal, [role="dialog"], .modal-content') {
    super(page.locator(rootSelector).first(), page);
    this.title = this.getChild('.modal-title, [role="heading"], h4, h5');
    this.body = this.getChild('.modal-body, p');
    this.confirmButton = this.getChild(
      'button:has-text("Confirm"), button:has-text("OK"), button:has-text("Continue"), button.btn-success'
    );
    this.cancelButton = this.getChild('button:has-text("Cancel"), button.btn-secondary');
    this.closeButton = this.getChild(
      'button.close, [aria-label="Close"], button:has-text("Close")'
    );
  }

  async getModalTitle(): Promise<string> {
    return await this.title.first().innerText();
  }

  async getModalBody(): Promise<string> {
    return await this.body.first().innerText();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.first().click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.first().click();
  }

  async close(): Promise<void> {
    await this.closeButton.first().click();
  }
}
