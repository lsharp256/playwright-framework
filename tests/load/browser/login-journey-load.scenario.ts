import { LoginPage } from '../../../src/pages/LoginPage.js';
import { BrowserLoadHelper } from '../../../src/performance/browser/BrowserLoadHelper.js';
import { LoadRunner } from '../../../src/performance/core/LoadRunner.js';
import { LoadProfileType, PerformanceTestResult } from '../../../src/performance/types/performance.types.js';

export async function runBrowserJourneyLoadScenario(
  runner: LoadRunner,
  options: { profile?: LoadProfileType; vus?: number; durationSeconds?: number } = {}
): Promise<PerformanceTestResult> {
  return runner.runBrowserLoadTest(
    {
      scenarioName: 'Browser Multi-User Journey Load Test',
      profile: options.profile || 'load',
      vus: options.vus || 2,
      durationSeconds: options.durationSeconds || 15,
      thinkTimeMs: 500,
    },
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      // 1. Navigate to Login Page
      await loginPage.navigate();

      // 2. Extract Browser Navigation Timing metrics
      const navTimings = await BrowserLoadHelper.extractNavigationMetrics(page);

      // 3. Perform basic form interaction
      await loginPage.fill(loginPage.emailInput, 'loadtest-user@test.com', 'Load Test Email');
      await loginPage.fill(loginPage.passwordInput, 'LoadTestPassword123!', 'Load Test Password');

      // Record browser timing to collector
      runner.getCollector().recordBrowserJourney({
        journeyName: 'Browser Multi-User Journey',
        stepName: 'Login-Page-Render',
        durationMs: navTimings.loadEventMs || 500,
        timestamp: Date.now(),
        success: true,
        vuId: 1,
        webVitals: {
          ttfbMs: navTimings.ttfbMs,
          domContentLoadedMs: navTimings.domContentLoadedMs,
          loadEventMs: navTimings.loadEventMs,
        },
      });
    }
  );
}
