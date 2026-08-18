import { ApiClient } from '../client/ApiClient.js';
import { ApiResponse } from '../../types/global.js';
import {
  CreateUserResponse,
  CreateUserResponseSchema,
  SingleUserResponse,
  SingleUserResponseSchema,
  UpdateUserResponse,
  UpdateUserResponseSchema,
  UserListResponse,
  UserListResponseSchema,
} from '../schemas/user.schema.js';
import { clientConfig } from '../../../config/client.config.js';

export class UserService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Fetches paginated list of users
   */
  async getUsers(limit: number = 10, skip: number = 0): Promise<ApiResponse<UserListResponse>> {
    const response = await this.client.get<UserListResponse>(clientConfig.endpoints.users.base, {
      params: { limit, skip },
    });

    if (response.status === 200) {
      this.client.validateSchema(UserListResponseSchema, response.data);
    }

    return response;
  }

  /**
   * Fetches single user by ID
   */
  async getUserById(id: string | number): Promise<ApiResponse<SingleUserResponse>> {
    const response = await this.client.get<SingleUserResponse>(
      clientConfig.endpoints.users.byId(id)
    );

    if (response.status === 200) {
      this.client.validateSchema(SingleUserResponseSchema, response.data);
    }

    return response;
  }

  /**
   * Creates/adds a new user
   */
  async createUser(userData: {
    firstName: string;
    lastName: string;
    age?: number;
  }): Promise<ApiResponse<CreateUserResponse>> {
    const endpoint = clientConfig.endpoints.users.add || clientConfig.endpoints.users.base;
    const response = await this.client.post<CreateUserResponse>(endpoint, userData);

    if (response.status === 201 || response.status === 200) {
      this.client.validateSchema(CreateUserResponseSchema, response.data);
    }

    return response;
  }

  /**
   * Updates an existing user
   */
  async updateUser(
    id: string | number,
    userData: { firstName?: string; lastName?: string; age?: number }
  ): Promise<ApiResponse<UpdateUserResponse>> {
    const response = await this.client.put<UpdateUserResponse>(
      clientConfig.endpoints.users.byId(id),
      userData
    );

    if (response.status === 200) {
      this.client.validateSchema(UpdateUserResponseSchema, response.data);
    }

    return response;
  }

  /**
   * Deletes a user by ID
   */
  async deleteUser(
    id: string | number
  ): Promise<ApiResponse<{ isDeleted: boolean; deletedOn?: string }>> {
    return this.client.delete<{ isDeleted: boolean; deletedOn?: string }>(
      clientConfig.endpoints.users.byId(id)
    );
  }
}
