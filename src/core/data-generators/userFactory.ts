import { faker } from '@faker-js/faker';
import { TestUser } from '../../types/global.js';
import { StringUtils } from '../utils/stringUtils.js';

export class UserFactory {
  /**
   * Generates a randomized user model with realistic data
   */
  static generateUser(overrides: Partial<TestUser> = {}): TestUser {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    return {
      name,
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: StringUtils.randomPassword(),
      role: 'user',
      job: faker.person.jobTitle(),
      ...overrides,
    };
  }

  /**
   * Generates an array of randomized user models
   */
  static generateUsers(count: number = 3, overrides: Partial<TestUser> = {}): TestUser[] {
    return Array.from({ length: count }, () => this.generateUser(overrides));
  }

  /**
   * Generates standard login credentials
   */
  static generateCredentials(): { email: string; password: string } {
    return {
      email: faker.internet.email().toLowerCase(),
      password: StringUtils.randomPassword(),
    };
  }

  /**
   * Generates realistic synthetic profile details
   */
  static generateProfile() {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      company: faker.company.name(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipcode: faker.location.zipCode(),
      mobileNumber: faker.phone.number(),
    };
  }
}
