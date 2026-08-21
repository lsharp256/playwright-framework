import { ENV } from './env.config.js';

/**
 * Client Configuration Preset
 *
 * Whenever onboarding a new client, customize this file to define:
 * 1. Base URL overrides or tenant subdomain resolvers
 * 2. API endpoints and version prefixes
 * 3. Feature flags and test personas
 * 4. Custom headers (e.g., tenant-id, api-key, client-id)
 */
export interface ClientConfig {
  clientName: string;
  baseUrl: string;
  apiUrl: string;
  apiVersion: string;
  endpoints: {
    auth: {
      login: string;
      register: string;
      logout: string;
      refreshToken: string;
    };
    users: {
      base: string;
      add?: string;
      byId: (id: string | number) => string;
    };
  };
  defaultHeaders: Record<string, string>;
  features: {
    enableA11yAudits: boolean;
    enableVisualSnapshots: boolean;
    enableApiMocking: boolean;
    enableTraceRecording: boolean;
  };
  performance: {
    targetSla: {
      p95MaxMs: number;
      p99MaxMs: number;
      maxErrorRatePercent: number;
      minThroughputRps: number;
    };
    defaultProfile: 'smoke' | 'load' | 'stress' | 'spike';
  };
  notifications: {
    slackEnabled: boolean;
    teamsEnabled: boolean;
    notifyOnFailureOnly: boolean;
  };
}

export const clientConfig: ClientConfig = {
  clientName: 'Client-Demo-App',
  baseUrl: ENV.BASE_URL,
  apiUrl: ENV.API_URL,
  apiVersion: 'v1',
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/users/add',
      logout: '/auth/logout',
      refreshToken: '/auth/refresh',
    },
    users: {
      base: '/users',
      add: '/users/add',
      byId: (id: string | number) => `/users/${id}`,
    },
  },
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Framework': 'Playwright-Enterprise',
  },
  features: {
    enableA11yAudits: true,
    enableVisualSnapshots: true,
    enableApiMocking: true,
    enableTraceRecording: true,
  },
  performance: {
    targetSla: {
      p95MaxMs: ENV.LOAD_TEST_SLA_P95_MS,
      p99MaxMs: ENV.LOAD_TEST_SLA_P99_MS,
      maxErrorRatePercent: ENV.LOAD_TEST_SLA_ERROR_RATE,
      minThroughputRps: 5,
    },
    defaultProfile: 'load',
  },
  notifications: {
    slackEnabled: Boolean(ENV.SLACK_WEBHOOK_URL),
    teamsEnabled: Boolean(ENV.TEAMS_WEBHOOK_URL),
    notifyOnFailureOnly: ENV.NOTIFY_ON_FAILURE_ONLY,
  },
};
