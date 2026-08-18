import { test as base, expect, mergeTests } from '@playwright/test';
import { apiFixture } from './api.fixture.js';
import { authFixture } from './auth.fixture.js';
import { a11yFixture } from './a11y.fixture.js';
export type { ApiFixtures } from './api.fixture.js';
export type { AuthFixtures } from './auth.fixture.js';
export type { A11yFixtures } from './a11y.fixture.js';
import { LoginPage } from '../pages/LoginPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';
import { VisualHelper } from '../helpers/visualHelper.js';
import { NetworkHelper } from '../helpers/networkHelper.js';
import { Logger } from '../core/logger/logger.js';
import { UserFactory } from '../core/data-generators/userFactory.js';

export interface PageObjects {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  visual: VisualHelper;
  network: NetworkHelper;
  logger: Logger;
  userFactory: typeof UserFactory;
}

const pageObjectsFixture = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  visual: async ({ page }, use) => {
    await use(new VisualHelper(page));
  },

  network: async ({ page }, use) => {
    await use(new NetworkHelper(page));
  },

  logger: async ({}, use) => {
    await use(new Logger('TestCase'));
  },

  userFactory: async ({}, use) => {
    await use(UserFactory);
  },
});

export const test = mergeTests(apiFixture, authFixture, a11yFixture, pageObjectsFixture);
export { expect };
