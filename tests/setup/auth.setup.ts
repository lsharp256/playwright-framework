import { test as setup } from '@playwright/test';
import { AUTH_FILE } from '../../src/fixtures/auth.fixture.js';
import fs from 'fs';
import path from 'path';

setup('global authentication setup', async () => {
  const authDir = path.dirname(AUTH_FILE.ADMIN);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Pre-seed an empty or cached storage state if site does not require mandatory login
  const defaultState = {
    cookies: [],
    origins: [],
  };

  fs.writeFileSync(AUTH_FILE.ADMIN, JSON.stringify(defaultState, null, 2));
  fs.writeFileSync(AUTH_FILE.USER, JSON.stringify(defaultState, null, 2));
});
