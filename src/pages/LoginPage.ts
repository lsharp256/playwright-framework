import { Locator, Page } from '@playwright/test';
import { BasePage } from './base/BasePage.js';
import { NavbarComponent } from './components/NavbarComponent.js';

export class LoginPage extends BasePage {
  readonly navbar: NavbarComponent;

  // Login form locators
  readonly loginHeader: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  // Signup form locators
  readonly signupHeader: Locator;
  readonly signupNameInput: Locator;
  readonly signupEmailInput: Locator;
  readonly signupButton: Locator;
  readonly signupErrorMessage: Locator;

  constructor(page: Page) {
    super(page, '/login');
    this.navbar = new NavbarComponent(page);

    // Login Form Elements
    this.loginHeader = page.locator('.login-form h2, h2:has-text("Login to your account")');
    this.emailInput = page
      .locator('input[data-qa="login-email"], input[name="email"], #email')
      .first();
    this.passwordInput = page
      .locator('input[data-qa="login-password"], input[name="password"], #password')
      .first();
    this.loginButton = page
      .locator(
        'button[data-qa="login-button"], button[type="submit"]:has-text("Login"), input[value="Login"]'
      )
      .first();
    this.errorMessage = page
      .locator('.login-form p[style*="color: red"], .alert-danger, .error-message')
      .first();

    // Signup Form Elements
    this.signupHeader = page.locator('.signup-form h2, h2:has-text("New User Signup!")');
    this.signupNameInput = page.locator('input[data-qa="signup-name"], input[name="name"]').first();
    this.signupEmailInput = page.locator('input[data-qa="signup-email"]').first();
    this.signupButton = page.locator('button[data-qa="signup-button"]').first();
    this.signupErrorMessage = page.locator('.signup-form p[style*="color: red"]').first();
  }

  async login(email: string, pass: string): Promise<void> {
    await this.logger.step(`Login with email: ${email}`, async () => {
      await this.fill(this.emailInput, email, 'Login Email');
      await this.fill(this.passwordInput, pass, 'Login Password');
      await this.click(this.loginButton, 'Login Button');
    });
  }

  async signup(name: string, email: string): Promise<void> {
    await this.logger.step(`Signup with name: ${name} and email: ${email}`, async () => {
      await this.fill(this.signupNameInput, name, 'Signup Name');
      await this.fill(this.signupEmailInput, email, 'Signup Email');
      await this.click(this.signupButton, 'Signup Button');
    });
  }

  async getLoginError(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  async isErrorMessageVisible(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }
}
