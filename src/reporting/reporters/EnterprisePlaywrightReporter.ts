import {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { HistoricalTracker } from '../analytics/HistoricalTracker.js';
import { HistoricalDashboardReporter } from './HistoricalDashboardReporter.js';
import { NotificationManager } from '../notifications/NotificationManager.js';
import {
  NotificationPayload,
  TestCaseRecord,
  TestRunRecord,
  TestStatus,
} from '../types/reporting.types.js';
import Table from 'cli-table3';

export default class EnterprisePlaywrightReporter implements Reporter {
  private startTime: number = Date.now();
  private runId: string = `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  private testRecords: TestCaseRecord[] = [];
  private tracker: HistoricalTracker;

  constructor() {
    this.tracker = new HistoricalTracker();
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
    this.testRecords = [];
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    let status: TestStatus = 'passed';
    if (result.status === 'timedOut') {
      status = 'timedOut';
    } else if (result.status === 'failed') {
      status = 'failed';
    } else if (result.status === 'skipped') {
      status = 'skipped';
    } else if (result.status === 'interrupted') {
      status = 'interrupted';
    } else if (result.status === 'passed') {
      status = result.retry > 0 ? 'flaky' : 'passed';
    }

    const testId = `${test.location.file}:${test.location.line}`;
    const errorMessage = result.error?.message || result.errors?.[0]?.message;
    const errorStack = result.error?.stack || result.errors?.[0]?.stack;

    this.testRecords.push({
      testId,
      title: test.title,
      fullTitle: test.titlePath().join(' › '),
      file: test.location.file.replace(process.cwd() + '/', ''),
      line: test.location.line,
      project: test.parent?.project()?.name || 'default',
      status,
      durationMs: result.duration,
      retryCount: result.retry,
      errorMessage,
      errorStack,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const totalDurationMs = Date.now() - this.startTime;
    const environment = process.env.TEST_ENV || 'dev';
    const branch = process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH || 'local-dev';
    const commitSha = process.env.GITHUB_SHA || process.env.GIT_COMMIT || 'local-head';
    const actor = process.env.GITHUB_ACTOR || process.env.USER || 'Local Runner';
    const ciRunUrl =
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined;

    const passedCount = this.testRecords.filter((t) => t.status === 'passed').length;
    const failedCount = this.testRecords.filter(
      (t) => t.status === 'failed' || t.status === 'timedOut'
    ).length;
    const flakyCount = this.testRecords.filter((t) => t.status === 'flaky').length;
    const skippedCount = this.testRecords.filter((t) => t.status === 'skipped').length;
    const isPassed = result.status === 'passed';

    const runRecord: TestRunRecord = {
      runId: this.runId,
      timestamp: new Date().toISOString(),
      environment,
      branch,
      commitSha,
      actor,
      ciRunUrl,
      totalTests: this.testRecords.length,
      passed: passedCount,
      failed: failedCount,
      flaky: flakyCount,
      skipped: skippedCount,
      durationMs: totalDurationMs,
      status: isPassed ? 'PASSED' : 'FAILED',
      tests: this.testRecords,
    };

    // 1. Record Run and update Historical Analytics
    const historicalSummary = this.tracker.recordRun(runRecord);

    // 2. Generate Interactive Historical & Flakiness Dashboard HTML
    const dashboardPath = HistoricalDashboardReporter.generateDashboard(historicalSummary);

    // 3. Highlight Frequently Failing Tests in CLI
    if (historicalSummary.frequentlyFailingTests.length > 0) {
      console.info('\n' + '!'.repeat(75));
      console.info('🚨 FREQUENTLY FAILING TESTS DETECTED (HIGH PRIORITY TRIAGE NEEDED)');
      console.info('!'.repeat(75));

      const failTable = new Table({
        head: ['Test Title', 'File', 'Failure Rate', 'Consecutive Fails', 'Historical Runs'],
        style: { head: ['red'] },
      });

      historicalSummary.frequentlyFailingTests.slice(0, 5).forEach((t) => {
        failTable.push([
          t.title,
          t.file,
          `\x1b[31m${t.failureRatePercent}%\x1b[0m`,
          `\x1b[33m${t.consecutiveFailures}\x1b[0m`,
          `${t.passedRuns}/${t.totalRuns} passed`,
        ]);
      });

      console.info(failTable.toString());
      console.info('!'.repeat(75) + '\n');
    }

    console.info(`\n📊 Historical & Flakiness Dashboard generated: ${dashboardPath}\n`);

    // 4. Dispatch Multi-Channel Notifications (Slack & MS Teams)
    const failedDetails = this.testRecords
      .filter((t) => t.status === 'failed' || t.status === 'timedOut')
      .map((t) => {
        const isRecurring = historicalSummary.frequentlyFailingTests.some(
          (f) => f.title === t.title && f.file === t.file
        );
        return {
          title: t.title,
          file: t.file,
          error: t.errorMessage,
          isRecurring,
        };
      });

    const notificationPayload: NotificationPayload = {
      runId: this.runId,
      status: isPassed ? 'PASSED' : 'FAILED',
      environment,
      totalTests: this.testRecords.length,
      passed: passedCount,
      failed: failedCount,
      flaky: flakyCount,
      skipped: skippedCount,
      durationSeconds: Math.round(totalDurationMs / 1000),
      branch,
      commitSha,
      actor,
      ciRunUrl,
      frequentlyFailingTests: historicalSummary.frequentlyFailingTests,
      failedTestDetails: failedDetails,
    };

    await NotificationManager.notifyAll(notificationPayload);
  }
}
