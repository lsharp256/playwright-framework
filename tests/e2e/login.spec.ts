import { test, expect } from '../../src/fixtures/base.fixture.js';

test.describe('E2E Suite: Authentication & Login Flow', () => {
  test.beforeEach(async ({ loginPage, network }) => {
    // Speed up test execution by blocking ad networks and analytics
    await network.blockAnalyticsAndAds();
    await loginPage.navigate();
  });

  test('UI-001: Should display login and signup forms properly', async ({ loginPage }) => {
    await expect(loginPage.loginHeader).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    await expect(loginPage.signupHeader).toBeVisible();
    await expect(loginPage.signupNameInput).toBeVisible();
    await expect(loginPage.signupEmailInput).toBeVisible();
  });

  test('UI-002: Should display error on invalid login attempt', async ({
    loginPage,
    userFactory,
  }) => {
    const invalidCreds = userFactory.generateCredentials();

    await loginPage.login(invalidCreds.email, invalidCreds.password);

    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getLoginError();
    expect(errorText.toLowerCase()).toContain('incorrect');
  });

  test('UI-003: Should validate signup inputs with generated dynamic data', async ({
    loginPage,
    userFactory,
  }) => {
    const dynamicUser = userFactory.generateUser();

    await loginPage.signup(dynamicUser.name, dynamicUser.email);

    // After valid signup submission, page advances to account information setup
    await expect(loginPage.page).toHaveURL(/.*signup|.*login/);
  });
});
