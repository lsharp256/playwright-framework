import { test as base } from '@playwright/test';
import { A11yHelper } from '../helpers/a11yHelper.js';

export interface A11yFixtures {
  a11y: A11yHelper;
}

export const a11yFixture = base.extend<A11yFixtures>({
  a11y: async ({ page }, use) => {
    const a11yHelper = new A11yHelper(page);
    await use(a11yHelper);
  },
});
