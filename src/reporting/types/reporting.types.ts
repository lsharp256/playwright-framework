export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted' | 'flaky';

export interface TestCaseRecord {
  testId: string;
  title: string;
  fullTitle: string;
  file: string;
  line: number;
  project: string;
  status: TestStatus;
  durationMs: number;
  retryCount: number;
  errorMessage?: string;
  errorStack?: string;
}

export interface TestRunRecord {
  runId: string;
  timestamp: string;
  environment: string;
  branch: string;
  commitSha: string;
  actor: string;
  ciRunUrl?: string;
  totalTests: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationMs: number;
  status: 'PASSED' | 'FAILED';
  tests: TestCaseRecord[];
}

export interface TestHistoricalStats {
  testId: string;
  title: string;
  file: string;
  project: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  flakyRuns: number;
  passRatePercent: number;
  failureRatePercent: number;
  consecutiveFailures: number;
  isFrequentlyFailing: boolean;
  isFlaky: boolean;
  avgDurationMs: number;
  lastFailureDate?: string;
  lastErrorMessage?: string;
  recentStatuses: TestStatus[];
}

export interface HistoricalAnalyticsSummary {
  totalRecordedRuns: number;
  overallPassRatePercent: number;
  totalUniqueTests: number;
  frequentlyFailingCount: number;
  flakyCount: number;
  frequentlyFailingTests: TestHistoricalStats[];
  flakyTests: TestHistoricalStats[];
  allTestStats: TestHistoricalStats[];
  runs: TestRunRecord[];
}

export interface NotificationPayload {
  runId: string;
  status: 'PASSED' | 'FAILED';
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  durationSeconds: number;
  branch: string;
  commitSha: string;
  actor: string;
  ciRunUrl?: string;
  reportUrl?: string;
  frequentlyFailingTests: TestHistoricalStats[];
  failedTestDetails: {
    title: string;
    file: string;
    error?: string;
    isRecurring: boolean;
  }[];
}

export interface SlackNotificationConfig {
  webhookUrl: string;
  channel?: string;
  notifyOnFailureOnly?: boolean;
}

export interface TeamsNotificationConfig {
  webhookUrl: string;
  notifyOnFailureOnly?: boolean;
}
