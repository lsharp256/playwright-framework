import { APIRequestContext, Page } from '@playwright/test';

export type LoadProfileType = 'smoke' | 'load' | 'stress' | 'spike' | 'soak';

export interface LoadStage {
  /** Target virtual user count for this stage */
  targetVus: number;
  /** Duration of this stage in seconds */
  durationSeconds: number;
}

export interface LoadProfile {
  name: LoadProfileType;
  description: string;
  stages: LoadStage[];
}

export interface SlaThresholds {
  p50MaxMs?: number;
  p90MaxMs?: number;
  p95MaxMs?: number;
  p99MaxMs?: number;
  maxErrorRatePercent?: number;
  minThroughputRps?: number;
  maxMeanLatencyMs?: number;
}

export interface LoadTestConfig {
  scenarioName: string;
  profile?: LoadProfileType;
  vus?: number;
  durationSeconds?: number;
  rampUpSeconds?: number;
  stages?: LoadStage[];
  sla?: SlaThresholds;
  thinkTimeMs?: number;
}

export interface RequestMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
  success: boolean;
  error?: string;
  vuId: number;
}

export interface BrowserJourneyMetric {
  journeyName: string;
  stepName: string;
  durationMs: number;
  timestamp: number;
  success: boolean;
  error?: string;
  vuId: number;
  webVitals?: {
    ttfbMs?: number;
    domContentLoadedMs?: number;
    loadEventMs?: number;
    lcpMs?: number;
    cls?: number;
  };
}

export interface LatencyStats {
  min: number;
  max: number;
  mean: number;
  median: number; // p50
  p90: number;
  p95: number;
  p99: number;
}

export interface MetricSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRatePercent: number;
  rps: number;
  durationSeconds: number;
  latency: LatencyStats;
  statusCodes: Record<number, number>;
  endpointBreakdown: Record<
    string,
    {
      count: number;
      successCount: number;
      errorCount: number;
      meanMs: number;
      p95Ms: number;
      minMs: number;
      maxMs: number;
    }
  >;
  browserMetrics?: {
    totalJourneys: number;
    avgJourneyDurationMs: number;
    avgTtfbMs?: number;
    avgDomContentLoadedMs?: number;
    avgLoadEventMs?: number;
  };
}

export interface SlaCheckItem {
  metric: string;
  target: string;
  actual: string;
  passed: boolean;
}

export interface SlaEvaluationResult {
  passed: boolean;
  checks: SlaCheckItem[];
}

export interface PerformanceTestResult {
  scenarioName: string;
  profile: string;
  vus: number;
  startTime: string;
  endTime: string;
  summary: MetricSummary;
  slaResult: SlaEvaluationResult;
}

export type ApiTaskFunction = (context: {
  vuId: number;
  requestContext: APIRequestContext;
  iteration: number;
}) => Promise<void>;

export type BrowserTaskFunction = (context: {
  vuId: number;
  page: Page;
  iteration: number;
}) => Promise<void>;
