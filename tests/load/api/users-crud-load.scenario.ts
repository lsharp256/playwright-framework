import { ApiClient } from '../../../src/api/client/ApiClient.js';
import { UserService } from '../../../src/api/services/UserService.js';
import { UserFactory } from '../../../src/core/data-generators/userFactory.js';
import { LoadRunner } from '../../../src/performance/core/LoadRunner.js';
import {
  LoadProfileType,
  PerformanceTestResult,
} from '../../../src/performance/types/performance.types.js';

export async function runUsersCrudLoadScenario(
  runner: LoadRunner,
  options: { profile?: LoadProfileType; vus?: number; durationSeconds?: number } = {}
): Promise<PerformanceTestResult> {
  return runner.runApiLoadTest(
    {
      scenarioName: 'User CRUD High-Throughput API Load',
      profile: options.profile || 'load',
      vus: options.vus,
      durationSeconds: options.durationSeconds,
      thinkTimeMs: 150,
    },
    async ({ vuId, requestContext, iteration }) => {
      const client = new ApiClient(requestContext);
      client.setMetricCollector(runner.getCollector(), vuId);

      const userService = new UserService(client);

      // 1. Read: Fetch users list
      await userService.getUsers(5, (iteration % 10) * 5);

      // 2. Read: Fetch user by ID
      const targetId = (iteration % 20) + 1;
      await userService.getUserById(targetId);

      // 3. Write: Create new user with dynamic Faker synthetic data
      const dynamicUser = UserFactory.generateUser();
      const [firstName, lastName] = dynamicUser.name.split(' ');
      await userService.createUser({
        firstName: firstName || 'LoadUser',
        lastName: lastName || `VU${vuId}`,
        age: 20 + (iteration % 40),
      });
    }
  );
}
