import { Locator, Page } from '@playwright/test';
import { BaseComponent } from '../base/BaseComponent.js';

export class NavbarComponent extends BaseComponent {
  readonly brandLogo: Locator;
  readonly homeLink: Locator;
  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly loginLink: Locator;
  readonly logoutLink: Locator;
  readonly loggedInAsUser: Locator;

  constructor(page: Page, rootSelector: string = 'header, .navbar, .shop-menu') {
    super(page.locator(rootSelector).first(), page);
    this.brandLogo = this.getChild('a[href="/"], .logo');
    this.homeLink = this.getChild('a[href="/"], a:has-text("Home")');
    this.productsLink = this.getChild('a[href*="product"], a:has-text("Products")');
    this.cartLink = this.getChild('a[href*="cart"], a:has-text("Cart")');
    this.loginLink = this.getChild(
      'a[href*="login"], a:has-text("Signup / Login"), a:has-text("Login")'
    );
    this.logoutLink = this.getChild('a[href*="logout"], a:has-text("Logout")');
    this.loggedInAsUser = this.getChild('li:has-text("Logged in as"), .user-name');
  }

  async clickHome(): Promise<void> {
    await this.homeLink.first().click();
  }

  async clickProducts(): Promise<void> {
    await this.productsLink.first().click();
  }

  async clickCart(): Promise<void> {
    await this.cartLink.first().click();
  }

  async clickLogin(): Promise<void> {
    await this.loginLink.first().click();
  }

  async clickLogout(): Promise<void> {
    await this.logoutLink.first().click();
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.logoutLink.first().isVisible();
  }

  async getLoggedInUsername(): Promise<string> {
    return (await this.loggedInAsUser.first().innerText()).trim();
  }
}
