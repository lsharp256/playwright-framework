export type TestEnvironment = 'dev' | 'staging' | 'prod' | 'local';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  timeout?: number;
  failOnStatusCode?: boolean;
  ignoreHTTPSErrors?: boolean;
}

export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  durationMs: number;
}

export interface UserCredentials {
  email?: string;
  username?: string;
  password: string;
  expiresInMins?: number;
  [key: string]: any;
}

export interface TestUser {
  id?: string | number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user' | 'guest';
  job?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface A11yScanOptions {
  includedImpacts?: ('minor' | 'moderate' | 'serious' | 'critical')[];
  wcagTags?: string[];
  scope?: string;
  exclude?: string[];
}
