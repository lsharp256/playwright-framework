# 🚀 Rapid Client Onboarding Guide (Under 5 Minutes)

This guide walks you through configuring and adapting this Playwright framework for a brand-new client project.

---

## ⏱️ Quick Start in 4 Steps

### Step 1: Clone and Install
```bash
git clone <your-repo-url>
cd playwright-framework
npm install
npx playwright install --with-deps chromium
```

---

### Step 2: Configure Environment Variables
Copy the `.env.example` file to create your environment configs:
```bash
cp .env.example .env.dev
cp .env.example .env.staging
cp .env.example .env.prod
```

Edit `.env.dev` with the client's targets:
```ini
TEST_ENV=dev
BASE_URL=https://app.client-domain.com
API_URL=https://api.client-domain.com
ADMIN_EMAIL=admin@client-domain.com
ADMIN_PASSWORD=YourSecureClientPassword123!
```

---

### Step 3: Update `config/client.config.ts`
Adjust endpoints and custom headers in `config/client.config.ts`:

```typescript
export const clientConfig: ClientConfig = {
  clientName: 'Acme-Corp-Portal',
  baseUrl: ENV.BASE_URL,
  apiUrl: ENV.API_URL,
  apiVersion: 'v1',
  endpoints: {
    auth: {
      login: '/v1/auth/login',
      register: '/v1/auth/register',
      logout: '/v1/auth/logout',
      refreshToken: '/v1/auth/refresh',
    },
    users: {
      base: '/v1/users',
      byId: (id) => `/v1/users/${id}`,
    },
  },
  defaultHeaders: {
    'Content-Type': 'application/json',
    'X-Client-ID': 'acme-web-client',
  },
  features: {
    enableA11yAudits: true,
    enableVisualSnapshots: true,
    enableApiMocking: true,
    enableTraceRecording: true,
  },
};
```

---

### Step 4: Add New Page Objects and Tests

#### 1. Create a Page Object (`src/pages/MyFeaturePage.ts`)
```typescript
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base/BasePage.js';

export class MyFeaturePage extends BasePage {
  readonly submitButton: Locator;
  readonly statusAlert: Locator;

  constructor(page: Page) {
    super(page, '/my-feature');
    this.submitButton = page.locator('button[type="submit"]');
    this.statusAlert = page.locator('.alert-info');
  }

  async submitForm(): Promise<void> {
    await this.click(this.submitButton, 'Submit Form Button');
  }
}
```

#### 2. Write a Test (`tests/e2e/my-feature.spec.ts`)
```typescript
import { test, expect } from '../../src/fixtures/base.fixture.js';

test.describe('My Feature E2E Flow', () => {
  test('Should submit form and display confirmation', async ({ page }) => {
    await page.goto('/my-feature');
    await expect(page.locator('h1')).toHaveText('My Feature');
  });
});
```

---

### Step 5: Configure Load Testing & Target SLAs

Define performance SLAs and default concurrency profiles in `config/client.config.ts`:

```typescript
performance: {
  targetSla: {
    p95MaxMs: 500,           // P95 latency must stay under 500ms
    p99MaxMs: 1200,          // P99 latency must stay under 1200ms
    maxErrorRatePercent: 0.5,// Max 0.5% errors allowed under load
    minThroughputRps: 50,    // Target minimum 50 requests/sec
  },
  defaultProfile: 'load',
}
```

Run load tests or customize virtual user counts:
```bash
# Run API load test against client staging
cross-env TEST_ENV=staging npm run test:load:api

# Run stress profile (ramp up to 3x concurrency)
npm run test:load:stress -- --vus=50 --duration=60
```

---

## 🛠️ Running Tests

| Command | Purpose |
|---|---|
| `npm run test` | Run entire test suite |
| `npm run test:ui` | Open interactive Playwright UI Mode |
| `npm run test:e2e` | Run only Web UI tests |
| `npm run test:api` | Run only REST API tests |
| `npm run test:hybrid` | Run API seed $\rightarrow$ UI verify tests |
| `npm run test:visual` | Run Visual snapshot regression tests |
| `npm run test:a11y` | Run WCAG accessibility compliance scans |
| `npm run test:load` | Run default Load & Performance test suite |
| `npm run test:load:api` | Run REST API high-throughput load tests |
| `npm run test:load:browser` | Run multi-user browser journey load tests |
| `npm run test:load:stress` | Run ramp-up stress testing profile |
| `npm run test:load:spike` | Run traffic spike load test profile |
| `npm run test:load:artillery` | Run Artillery YAML load scenario |
| `npm run test:dev` | Run suite against Dev environment |
| `npm run test:staging` | Run suite against Staging environment |
| `npm run report` | Open the HTML Playwright test report |
