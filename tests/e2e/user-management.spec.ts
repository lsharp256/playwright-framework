import { test, expect } from '../../src/fixtures/base.fixture.js';

test.describe('E2E Suite: Catalog Browsing & Dashboard Interaction', () => {
  test.beforeEach(async ({ dashboardPage, network }) => {
    await network.blockAnalyticsAndAds();
    await dashboardPage.navigate();
  });

  test('UI-004: Should load homepage with featured products and category sidebars', async ({
    dashboardPage,
  }) => {
    await expect(dashboardPage.featureItemsHeader).toBeVisible();
    const count = await dashboardPage.getProductCount();
    expect(count).toBeGreaterThan(0);
  });

  test('UI-005: Should search products by keyword and display results', async ({
    dashboardPage,
  }) => {
    const searchTerm = 'dress';
    await dashboardPage.searchProduct(searchTerm);

    await expect(dashboardPage.page).toHaveURL(/.*products\?search=dress/);
    const resultCount = await dashboardPage.getProductCount();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('UI-006: Should navigate across main header links', async ({ dashboardPage }) => {
    await dashboardPage.navbar.clickProducts();
    await expect(dashboardPage.page).toHaveURL(/.*products/);

    await dashboardPage.navbar.clickCart();
    await expect(dashboardPage.page).toHaveURL(/.*view_cart/);
  });
});
