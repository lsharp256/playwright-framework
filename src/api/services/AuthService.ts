import { ApiClient } from '../client/ApiClient.js';
import { ApiResponse, UserCredentials } from '../../types/global.js';
import {
  LoginSuccessResponse,
  LoginSuccessResponseSchema,
  RegisterSuccessResponse,
  RegisterSuccessResponseSchema,
} from '../schemas/auth.schema.js';
import { clientConfig } from '../../../config/client.config.js';

export class AuthService {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Performs API login and returns token
   */
  async login(credentials: UserCredentials): Promise<ApiResponse<LoginSuccessResponse>> {
    const response = await this.client.post<LoginSuccessResponse>(
      clientConfig.endpoints.auth.login,
      credentials
    );

    if (response.status === 200) {
      this.client.validateSchema(LoginSuccessResponseSchema, response.data);
      const token = response.data.accessToken || response.data.token;
      if (token) {
        this.client.setAuthToken(token);
      }
    }

    return response;
  }

  /**
   * Registers a new user account via API
   */
  async register(credentials: UserCredentials): Promise<ApiResponse<RegisterSuccessResponse>> {
    const response = await this.client.post<RegisterSuccessResponse>(
      clientConfig.endpoints.auth.register,
      credentials
    );

    if (response.status === 200 || response.status === 201) {
      this.client.validateSchema(RegisterSuccessResponseSchema, response.data);
    }

    return response;
  }
}
