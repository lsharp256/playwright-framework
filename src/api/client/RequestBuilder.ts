import { ApiClient } from './ApiClient.js';
import { ApiResponse, HttpMethod, RequestOptions } from '../../types/global.js';

/**
 * Fluent request builder for constructing and chaining complex HTTP requests.
 */
export class RequestBuilder<T = any> {
  private client: ApiClient;
  private method: HttpMethod = 'GET';
  private endpoint: string = '';
  private options: RequestOptions = {
    headers: {},
    params: {},
    data: undefined,
  };

  constructor(client: ApiClient) {
    this.client = client;
  }

  get(endpoint: string): this {
    this.method = 'GET';
    this.endpoint = endpoint;
    return this;
  }

  post(endpoint: string): this {
    this.method = 'POST';
    this.endpoint = endpoint;
    return this;
  }

  put(endpoint: string): this {
    this.method = 'PUT';
    this.endpoint = endpoint;
    return this;
  }

  patch(endpoint: string): this {
    this.method = 'PATCH';
    this.endpoint = endpoint;
    return this;
  }

  delete(endpoint: string): this {
    this.method = 'DELETE';
    this.endpoint = endpoint;
    return this;
  }

  withHeader(key: string, value: string): this {
    this.options.headers = { ...this.options.headers, [key]: value };
    return this;
  }

  withHeaders(headers: Record<string, string>): this {
    this.options.headers = { ...this.options.headers, ...headers };
    return this;
  }

  withParam(key: string, value: string | number | boolean): this {
    this.options.params = { ...this.options.params, [key]: value };
    return this;
  }

  withParams(params: Record<string, string | number | boolean>): this {
    this.options.params = { ...this.options.params, ...params };
    return this;
  }

  withBody(data: unknown): this {
    this.options.data = data;
    return this;
  }

  withTimeout(timeoutMs: number): this {
    this.options.timeout = timeoutMs;
    return this;
  }

  async send(): Promise<ApiResponse<T>> {
    switch (this.method) {
      case 'GET':
        return this.client.get<T>(this.endpoint, this.options);
      case 'POST':
        return this.client.post<T>(this.endpoint, this.options.data, this.options);
      case 'PUT':
        return this.client.put<T>(this.endpoint, this.options.data, this.options);
      case 'PATCH':
        return this.client.patch<T>(this.endpoint, this.options.data, this.options);
      case 'DELETE':
        return this.client.delete<T>(this.endpoint, this.options);
      default:
        throw new Error(`Unsupported HTTP method: ${this.method}`);
    }
  }
}
