# 🎭 Enterprise Playwright Test Automation Framework

An enterprise-ready, turn-key test automation framework built with **TypeScript**, **Playwright**, **Axe-core**, **Zod**, and **Faker.js**, designed to support rapid client onboarding across Web UI, REST APIs, Visual Regression, and Accessibility testing.

---

## 🌟 Key Features

- 🏗️ **Modular Architecture**: Page Object Model (POM) + Component Object Model (COM) with custom resilient action wrappers.
- 🔌 **Unified REST API Client**: Built-in request builder, automatic Bearer/API-key token management, response latency tracking, and Zod response schema validation.
- 🔄 **Hybrid Test Workflows**: Seed test data via API $\rightarrow$ execute actions via UI $\rightarrow$ verify via API $\rightarrow$ automated teardown.
- 👁️ **Visual Regression Testing**: Pixelmatch snapshot comparison with element masking for dynamic content.
- ♿ **Accessibility (A11y) Audits**: Automated WCAG 2.1 AA scans powered by `@axe-core/playwright`.
- ⚡ **Load & Performance Testing**: High-throughput REST API load runner, multi-browser synthetic journey load tests, Artillery integration, percentile latency tracking (p50/p90/p95/p99), and SLA validation.
- 📈 **Historical Analytics & Flakiness Intelligence**: Persistent cross-run history tracking, automatic detection of **Frequently Failing Tests** and **Flaky Tests**, and interactive trend analytics.
- 📢 **Slack & Microsoft Teams CI/CD Alerts**: Real-time rich Block Kit and Adaptive Card notifications with run metrics, failure summaries, and direct artifact links.
- 📊 **Rich Multi-Layer Reporting**: Standard Playwright HTML report, **Allure 2.0 Reports**, interactive **Historical Health Dashboard**, and JUnit XML.
- 🌐 **Multi-Environment Support**: Type-safe `.env` parsing (`dev`, `staging`, `prod`, `local`) with Zod validation.
- ⚡ **Session Reuse**: Global `storageState` caching to eliminate repetitive login steps in E2E suites.
- 🎲 **Dynamic Synthetic Data**: Faker.js data factory producing realistic test models on demand.
- 📊 **Rich Observability**: Winston structured logging with Playwright `test.step()` breadcrumbs, HTML reports, JUnit XML, screenshots, and trace viewer on failure.
- 🚀 **CI/CD & Docker Ready**: Pre-configured GitHub Actions matrix sharding workflows, history caching, and Docker Compose.

---

## 📂 Project Architecture

```
playwright-framework/
├── .github/workflows/         # CI/CD, Scheduled Synthetic & Load workflows
├── config/
│   ├── env.config.ts          # Zod-validated environment config
│   └── client.config.ts       # Client endpoints, SLAs & notification overrides
├── src/
│   ├── api/
│   │   ├── client/            # ApiClient & RequestBuilder
│   │   ├── schemas/           # Zod schema validation models
│   │   └── services/          # Domain API services (Auth, User)
│   ├── core/
│   │   ├── data-generators/   # Faker test data factories
│   │   ├── logger/            # Winston structured logger
│   │   └── utils/             # Date, String, Wait utilities
│   ├── fixtures/              # Custom Playwright test fixture extensions
│   ├── helpers/               # A11y, Visual snapshot, Network mocking helpers
│   ├── pages/                 # POM & COM page/component classes
│   ├── performance/           # Load runner, metrics, SLA validator & HTML reporters
│   ├── reporting/             # Historical tracker, Slack/Teams notifiers, Allure & Dashboard
│   └── types/                 # TypeScript type declarations
├── tests/
│   ├── setup/                 # Global authentication setup
│   ├── e2e/                   # Web UI E2E test suites
│   ├── api/                   # REST API test suites
│   ├── hybrid/                # Hybrid E2E + API test suites
│   ├── visual/                # Visual regression test suites
│   ├── accessibility/         # WCAG 2.1 AA audit test suites
│   └── load/                  # REST API, Browser & Artillery load test scenarios
├── Dockerfile                 # Containerized test runner
├── docker-compose.yml         # Compose runner
├── playwright.config.ts       # Root Playwright configuration
└── tsconfig.json              # TypeScript configuration with aliases
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18 (Node 22+ recommended)
- npm or yarn

### 2. Installation
```bash
npm install
npx playwright install --with-deps chromium
```

### 3. Running Test Suites

```bash
# Run all tests
npm test

# Open interactive Playwright UI Mode
npm run test:ui

# Run only REST API test suite
npm run test:api

# Run only Web UI E2E test suite
npm run test:e2e

# Run Hybrid (API Seed -> UI Verify) suite
npm run test:hybrid

# Run Visual Regression tests
npm run test:visual

# Run Accessibility (a11y) scans
npm run test:a11y

# --- Performance & Load Testing ---
# Run default API load test suite
npm run test:load

# Run only REST API high-throughput load tests
npm run test:load:api

# Run multi-user Browser journey load tests
npm run test:load:browser

# Run stress profile (gradually ramp up to 3x peak load)
npm run test:load:stress

# Run spike profile (sudden high-traffic burst)
npm run test:load:spike

# Run Artillery load test scenarios
npm run test:load:artillery
npm run test:load:artillery:report

# Run against Staging environment
npm run test:staging

# --- Rich Reporting & Notifications ---
# Open standard Playwright HTML Report
npm run report

# Generate and view Allure Report
npm run report:allure

# View Historical Flakiness & Failure Trends Dashboard
npm run report:history

# Test dispatch Slack / Microsoft Teams CI notifications
npm run notify
```

---

## 🧭 Onboarding a New Client

Refer to the [Client Onboarding Guide](file:///home/leroysharp/Documents/Github/playwright-framework/CLIENT_ONBOARDING.md) for a 4-step walkthrough on pointing this framework to any new website or API in under 5 minutes.

---

## 🐳 Docker Execution

```bash
# Run tests inside Docker
docker-compose up --build
```

---

## 📜 License
MIT
