import { APIRequestContext, APIResponse } from '@playwright/test';
import { z, ZodType } from 'zod';
import { ApiResponse, RequestOptions } from '../../types/global.js';
import { Logger } from '../../core/logger/logger.js';
import { clientConfig } from '../../../config/client.config.js';
import { ENV } from '../../../config/env.config.js';
import type { MetricCollector } from '../../performance/core/MetricCollector.js';

export class ApiClient {
  private request: APIRequestContext;
  private baseUrl: string;
  private authToken?: string;
  private defaultHeaders: Record<string, string>;
  private logger: Logger;
  private metricCollector?: MetricCollector;
  private vuId?: number;

  constructor(
    request: APIRequestContext,
    baseUrl: string = ENV.API_URL,
    customHeaders: Record<string, string> = {}
  ) {
    this.request = request;
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      ...clientConfig.defaultHeaders,
      ...customHeaders,
    };
    this.logger = new Logger('ApiClient');
  }

  /**
   * Attaches a MetricCollector for performance and load test metrics
   */
  setMetricCollector(collector?: MetricCollector, vuId?: number): this {
    this.metricCollector = collector;
    this.vuId = vuId;
    return this;
  }

  /**
   * Sets or updates Bearer authentication token for subsequent requests
   */
  setAuthToken(token: string): this {
    this.authToken = token;
    return this;
  }

  /**
   * Clears the current authentication token
   */
  clearAuthToken(): this {
    this.authToken = undefined;
    return this;
  }

  /**
   * Sets custom request header
   */
  setHeader(key: string, value: string): this {
    this.defaultHeaders[key] = value;
    return this;
  }

  private resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${cleanBase}/${cleanEndpoint}`;
  }

  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    if (this.authToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async executeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.resolveUrl(endpoint);
    const headers = this.buildHeaders(options.headers);
    const startTime = Date.now();

    this.logger.debug(`HTTP ${method} Request: ${url}`, {
      params: options.params,
      hasPayload: Boolean(options.data),
    });

    let rawResponse: APIResponse;

    try {
      rawResponse = await this.request.fetch(url, {
        method,
        headers,
        params: options.params,
        data: options.data,
        timeout: options.timeout || ENV.DEFAULT_TIMEOUT,
        failOnStatusCode: options.failOnStatusCode ?? false,
        ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? false,
      });
    } catch (error) {
      if (this.metricCollector) {
        this.metricCollector.recordRequest({
          endpoint,
          method,
          statusCode: 0,
          durationMs: Date.now() - startTime,
          timestamp: startTime,
          success: false,
          error: (error as Error).message,
          vuId: this.vuId ?? 1,
        });
      }
      this.logger.error(`Network Error during ${method} ${url}: ${(error as Error).message}`);
      throw error;
    }

    const durationMs = Date.now() - startTime;
    const status = rawResponse.status();
    const statusText = rawResponse.statusText();

    if (this.metricCollector) {
      this.metricCollector.recordRequest({
        endpoint,
        method,
        statusCode: status,
        durationMs,
        timestamp: startTime,
        success: status >= 200 && status < 400,
        error: status >= 400 ? `HTTP ${status} ${statusText}` : undefined,
        vuId: this.vuId ?? 1,
      });
    }

    let data: any = null;
    const contentType = rawResponse.headers()['content-type'] || '';

    try {
      if (contentType.includes('application/json')) {
        data = await rawResponse.json();
      } else {
        data = await rawResponse.text();
      }
    } catch {
      data = null;
    }

    this.logger.debug(
      `HTTP ${method} Response [${status} ${statusText}] (${durationMs}ms): ${url}`
    );

    return {
      status,
      statusText,
      headers: rawResponse.headers(),
      data: data as T,
      durationMs,
    };
  }

  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('GET', endpoint, options);
  }

  async post<T = any>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'data'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('POST', endpoint, { ...options, data });
  }

  async put<T = any>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'data'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PUT', endpoint, { ...options, data });
  }

  async patch<T = any>(
    endpoint: string,
    data?: unknown,
    options?: Omit<RequestOptions, 'data'>
  ): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('PATCH', endpoint, { ...options, data });
  }

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.executeRequest<T>('DELETE', endpoint, options);
  }

  /**
   * Validates response data against a Zod schema
   */
  validateSchema<S extends ZodType<any, any, any>>(schema: S, data: unknown): z.infer<S> {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      const errorMsg = `Schema validation failed: ${JSON.stringify(parseResult.error.format())}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    return parseResult.data;
  }
}
