import { test, expect } from '../../src/fixtures/base.fixture.js';

test.describe('Visual Regression Suite: Snapshot Matching', () => {
  test('VISUAL-001: Login Form Component visual snapshot', async ({
    loginPage,
    visual,
    network,
  }) => {
    await network.blockAnalyticsAndAds();
    await loginPage.navigate();

    const loginBox = loginPage.page.locator('.login-form').first();
    await expect(loginBox).toBeVisible();

    // Verify component visually matches baseline
    await visual.compareElementSnapshot(loginBox, 'login-form-component.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('VISUAL-002: Navigation Bar visual snapshot', async ({ dashboardPage, visual, network }) => {
    await network.blockAnalyticsAndAds();
    await dashboardPage.navigate();

    const navbar = dashboardPage.page.locator('header#header, .header-middle').first();
    await expect(navbar).toBeVisible();

    await visual.compareElementSnapshot(navbar, 'header-navbar.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
