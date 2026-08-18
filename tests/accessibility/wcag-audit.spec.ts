import { test, expect } from '../../src/fixtures/base.fixture.js';

test.describe('Accessibility Suite: WCAG 2.1 AA Compliance Audits', () => {
  test('A11Y-001: Login Form accessibility compliance audit', async ({
    loginPage,
    a11y,
    network,
    logger,
  }) => {
    await network.blockAnalyticsAndAds();
    await loginPage.navigate();

    logger.info('Scanning Login Form for WCAG 2.1 AA violations...');

    // Audit the login form container
    const scanResult = await a11y.scan({
      scope: '.login-form',
      wcagTags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      includedImpacts: ['critical'],
    });

    expect(
      scanResult.violations.length,
      `Expected 0 critical accessibility violations in login form, found ${scanResult.violations.length}`
    ).toBe(0);
  });

  test('A11Y-002: Navigation Header accessibility compliance audit', async ({
    dashboardPage,
    a11y,
    network,
    logger,
  }) => {
    await network.blockAnalyticsAndAds();
    await dashboardPage.navigate();

    logger.info('Scanning Header Navbar for accessibility compliance...');

    const scanResult = await a11y.scan({
      scope: 'header#header',
      wcagTags: ['wcag2a', 'wcag2aa'],
      includedImpacts: ['critical'],
    });

    expect(
      scanResult.violations.length,
      `Expected 0 critical a11y violations in header, found ${scanResult.violations.length}`
    ).toBe(0);
  });
});
