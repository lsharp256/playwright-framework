import { test as base, Page } from '@playwright/test';
import { ENV } from '../../config/env.config.js';
import { UserCredentials } from '../types/global.js';
import fs from 'fs';
import path from 'path';

export interface AuthFixtures {
  adminCredentials: UserCredentials;
  standardCredentials: UserCredentials;
  authenticatedAdminPage: Page;
}

export const AUTH_FILE = {
  ADMIN: path.resolve(process.cwd(), '.auth/admin.json'),
  USER: path.resolve(process.cwd(), '.auth/user.json'),
};

export const authFixture = base.extend<AuthFixtures>({
  adminCredentials: async ({}, use) => {
    await use({
      email: ENV.ADMIN_EMAIL,
      password: ENV.ADMIN_PASSWORD,
    });
  },

  standardCredentials: async ({}, use) => {
    await use({
      email: ENV.STANDARD_USER_EMAIL,
      password: ENV.STANDARD_USER_PASSWORD,
    });
  },

  authenticatedAdminPage: async ({ browser }, use) => {
    let context;
    if (fs.existsSync(AUTH_FILE.ADMIN)) {
      context = await browser.newContext({ storageState: AUTH_FILE.ADMIN });
    } else {
      context = await browser.newContext();
    }
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
