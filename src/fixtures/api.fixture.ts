import { test as base } from '@playwright/test';
import { ApiClient } from '../api/client/ApiClient.js';
import { AuthService } from '../api/services/AuthService.js';
import { UserService } from '../api/services/UserService.js';

export interface ApiFixtures {
  apiClient: ApiClient;
  authService: AuthService;
  userService: UserService;
}

export const apiFixture = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    await use(client);
  },

  authService: async ({ apiClient }, use) => {
    const service = new AuthService(apiClient);
    await use(service);
  },

  userService: async ({ apiClient }, use) => {
    const service = new UserService(apiClient);
    await use(service);
  },
});
