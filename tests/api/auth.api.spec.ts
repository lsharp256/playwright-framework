import { test, expect } from '../../src/fixtures/base.fixture.js';
import { LoginSuccessResponseSchema } from '../../src/api/schemas/auth.schema.js';

test.describe('API Suite: Authentication & Authorization', () => {
  test('POST /auth/login - should successfully authenticate with valid credentials', async ({
    authService,
    apiClient,
  }) => {
    const credentials = {
      email: 'emilys',
      password: 'emilyspass',
    };

    const response = await authService.login({
      ...credentials,
      username: 'emilys',
    } as any);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessToken');
    expect(typeof response.data.accessToken).toBe('string');
    expect(response.durationMs).toBeLessThan(5000);

    const validated = apiClient.validateSchema(LoginSuccessResponseSchema, response.data);
    expect(validated.accessToken).toBeTruthy();
  });

  test('POST /auth/login - should return 400 with invalid credentials', async ({ authService }) => {
    const invalidCredentials = {
      email: 'invalid_user',
      password: 'wrong_password',
      username: 'invalid_user',
    };

    const response = await authService.login(invalidCredentials as any);

    expect(response.status).toBe(400);
    expect(response.data).toHaveProperty('message');
  });

  test('POST /users/add - should register a new account payload', async ({
    userService,
    userFactory,
  }) => {
    const dynamicUser = userFactory.generateUser();
    const [firstName, lastName] = dynamicUser.name.split(' ');

    const response = await userService.createUser({
      firstName: firstName || 'Alice',
      lastName: lastName || 'Smith',
      age: 28,
    });

    expect([200, 201]).toContain(response.status);
    expect(response.data).toHaveProperty('id');
    expect(response.data.firstName).toBe(firstName || 'Alice');
  });
});
