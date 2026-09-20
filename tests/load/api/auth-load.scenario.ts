import { ApiClient } from '../../../src/api/client/ApiClient.js';
import { AuthService } from '../../../src/api/services/AuthService.js';
import { LoadRunner } from '../../../src/performance/core/LoadRunner.js';
import {
  LoadProfileType,
  PerformanceTestResult,
} from '../../../src/performance/types/performance.types.js';

export async function runAuthLoadScenario(
  runner: LoadRunner,
  options: { profile?: LoadProfileType; vus?: number; durationSeconds?: number } = {}
): Promise<PerformanceTestResult> {
  return runner.runApiLoadTest(
    {
      scenarioName: 'Authentication High-Concurrency API Load',
      profile: options.profile || 'load',
      vus: options.vus,
      durationSeconds: options.durationSeconds,
      thinkTimeMs: 100,
    },
    async ({ vuId, requestContext }) => {
      const client = new ApiClient(requestContext);
      client.setMetricCollector(runner.getCollector(), vuId);

      const authService = new AuthService(client);

      // Execute login request with standard credentials
      const loginResponse = await authService.login({
        username: 'emilys',
        password: 'emilyspass',
        expiresInMins: 30,
      });

      if (loginResponse.status !== 200) {
        throw new Error(`Login failed with status ${loginResponse.status}`);
      }
    }
  );
}
