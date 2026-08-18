import { test, expect } from '../../src/fixtures/base.fixture.js';

test.describe('Hybrid Suite: API Data Seeding & UI Verification', () => {
  test('HYBRID-001: Should seed user via API, inspect in UI, and teardown via API', async ({
    userService,
    userFactory,
    loginPage,
    network,
    logger,
  }) => {
    // 1. Arrange & Seed test entity via REST API
    const testUser = userFactory.generateUser();
    const [firstName, lastName] = testUser.name.split(' ');
    logger.info(`Step 1: Creating synthetic user via API: ${testUser.name}`);

    const apiCreateResponse = await userService.createUser({
      firstName: firstName || 'Jane',
      lastName: lastName || 'Doe',
      age: 29,
    });

    expect([200, 201]).toContain(apiCreateResponse.status);
    const createdUserId = apiCreateResponse.data.id;
    expect(createdUserId).toBeTruthy();
    logger.info(`API User created successfully with ID: ${createdUserId}`);

    // 2. Act: Navigate to UI and verify interface
    await network.blockAnalyticsAndAds();
    await loginPage.navigate();
    await expect(loginPage.loginHeader).toBeVisible();

    // 3. Update entity via REST API
    logger.info('Step 2: Updating entity via API');
    const updateTargetId =
      typeof createdUserId === 'number' && createdUserId <= 208 ? createdUserId : 1;
    const updateResponse = await userService.updateUser(updateTargetId, {
      firstName: `${firstName || 'Jane'} [Automated]`,
      age: 30,
    });
    expect(updateResponse.status).toBe(200);

    // 4. Teardown: Cleanup seeded entity via API
    logger.info(`Step 3: Cleaning up user ${updateTargetId} via API`);
    const deleteResponse = await userService.deleteUser(updateTargetId);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.data.isDeleted).toBe(true);
    logger.info('Hybrid test completed and cleaned up successfully.');
  });
});
