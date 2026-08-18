import { test, expect } from '../../src/fixtures/base.fixture.js';
import {
  CreateUserResponseSchema,
  SingleUserResponseSchema,
  UserListResponseSchema,
} from '../../src/api/schemas/user.schema.js';

test.describe('API Suite: User Management CRUD', () => {
  test('GET /users - should retrieve paginated users list with valid schema', async ({
    userService,
    apiClient,
  }) => {
    const response = await userService.getUsers(5, 0);

    expect(response.status).toBe(200);
    expect(response.data.users.length).toBe(5);
    expect(response.data.limit).toBe(5);

    // Validate entire response structure matches Zod contract
    const validated = apiClient.validateSchema(UserListResponseSchema, response.data);
    expect(validated.users[0]).toHaveProperty('id');
    expect(validated.users[0]).toHaveProperty('email');
  });

  test('GET /users/:id - should retrieve a specific user by ID', async ({
    userService,
    apiClient,
  }) => {
    const userId = 1;
    const response = await userService.getUserById(userId);

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(userId);
    expect(response.data.firstName).toBe('Emily');

    const validated = apiClient.validateSchema(SingleUserResponseSchema, response.data);
    expect(validated.email).toContain('@');
  });

  test('GET /users/:id - should return 404 for non-existent user ID', async ({ userService }) => {
    const response = await userService.getUserById(99999);
    expect(response.status).toBe(404);
  });

  test('POST /users/add - should create a new user with dynamic Faker data', async ({
    userService,
    userFactory,
    apiClient,
  }) => {
    const dynamicUser = userFactory.generateUser();
    const [firstName, lastName] = dynamicUser.name.split(' ');

    const payload = {
      firstName: firstName || 'John',
      lastName: lastName || 'Doe',
      age: 30,
    };

    const response = await userService.createUser(payload);

    expect([200, 201]).toContain(response.status);
    expect(response.data.firstName).toBe(payload.firstName);
    expect(response.data.lastName).toBe(payload.lastName);
    expect(response.data).toHaveProperty('id');

    const validated = apiClient.validateSchema(CreateUserResponseSchema, response.data);
    expect(validated.id).toBeTruthy();
  });

  test('PUT /users/:id - should update user attributes', async ({ userService }) => {
    const updatePayload = {
      lastName: 'Smith-Updated',
      age: 35,
    };

    const response = await userService.updateUser(1, updatePayload);

    expect(response.status).toBe(200);
    expect(response.data.lastName).toBe(updatePayload.lastName);
    expect(response.data.age).toBe(updatePayload.age);
  });

  test('DELETE /users/:id - should delete user and return deleted status', async ({
    userService,
  }) => {
    const response = await userService.deleteUser(1);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('isDeleted');
    expect(response.data.isDeleted).toBe(true);
  });
});
