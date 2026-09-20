import * as fs from 'fs';
import * as path from 'path';
import {
  HistoricalAnalyticsSummary,
  TestCaseRecord,
  TestHistoricalStats,
  TestRunRecord,
  TestStatus,
} from '../types/reporting.types.js';

export class HistoricalTracker {
  private historyFilePath: string;
  private maxRetentionRuns: number;

  constructor(
    historyFilePath: string = '.test-history/history.json',
    maxRetentionRuns: number = 50
  ) {
    this.historyFilePath = path.resolve(process.cwd(), historyFilePath);
    this.maxRetentionRuns = maxRetentionRuns;
  }

  /**
   * Loads existing test run history from disk
   */
  loadHistory(): TestRunRecord[] {
    try {
      if (fs.existsSync(this.historyFilePath)) {
        const data = fs.readFileSync(this.historyFilePath, 'utf-8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      // Return empty array if file is corrupted or unreadable
    }
    return [];
  }

  /**
   * Records a new test run into the persistent history database
   */
  recordRun(newRun: TestRunRecord): HistoricalAnalyticsSummary {
    const history = this.loadHistory();

    // Prevent duplicate run entries
    const filteredHistory = history.filter((r) => r.runId !== newRun.runId);
    filteredHistory.push(newRun);

    // Apply rolling retention window (keep newest N runs)
    const trimmedHistory = filteredHistory.slice(-this.maxRetentionRuns);

    // Persist to disk
    const dir = path.dirname(this.historyFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.historyFilePath, JSON.stringify(trimmedHistory, null, 2), 'utf-8');

    // Also mirror to test-results/history/history.json for report artifacts
    const mirrorPath = path.resolve(process.cwd(), 'test-results/history/history.json');
    const mirrorDir = path.dirname(mirrorPath);
    if (!fs.existsSync(mirrorDir)) {
      fs.mkdirSync(mirrorDir, { recursive: true });
    }
    fs.writeFileSync(mirrorPath, JSON.stringify(trimmedHistory, null, 2), 'utf-8');

    return this.analyzeHistory(trimmedHistory);
  }

  /**
   * Analyzes historical runs and identifies frequently failing and flaky tests
   */
  analyzeHistory(history?: TestRunRecord[]): HistoricalAnalyticsSummary {
    const runs = history || this.loadHistory();
    if (runs.length === 0) {
      return {
        totalRecordedRuns: 0,
        overallPassRatePercent: 100,
        totalUniqueTests: 0,
        frequentlyFailingCount: 0,
        flakyCount: 0,
        frequentlyFailingTests: [],
        flakyTests: [],
        allTestStats: [],
        runs: [],
      };
    }

    const testMap = new Map<string, TestCaseRecord[]>();

    runs.forEach((run) => {
      run.tests.forEach((test) => {
        const key = `${test.file}:::${test.title}:::${test.project}`;
        if (!testMap.has(key)) {
          testMap.set(key, []);
        }
        testMap.get(key)!.push(test);
      });
    });

    const allTestStats: TestHistoricalStats[] = [];

    testMap.forEach((testRecords) => {
      const sample = testRecords[testRecords.length - 1];
      const totalRuns = testRecords.length;
      const passedRuns = testRecords.filter((t) => t.status === 'passed').length;
      const failedRuns = testRecords.filter(
        (t) => t.status === 'failed' || t.status === 'timedOut'
      ).length;
      const flakyRuns = testRecords.filter((t) => t.status === 'flaky' || t.retryCount > 0).length;

      const passRatePercent = Math.round((passedRuns / totalRuns) * 100);
      const failureRatePercent = Math.round((failedRuns / totalRuns) * 100);

      // Compute consecutive failures backwards from the most recent run
      let consecutiveFailures = 0;
      for (let i = testRecords.length - 1; i >= 0; i--) {
        if (testRecords[i].status === 'failed' || testRecords[i].status === 'timedOut') {
          consecutiveFailures++;
        } else {
          break;
        }
      }

      // Frequently failing criteria: >= 20% failure rate (with at least 2 runs) or >= 2 consecutive failures
      const isFrequentlyFailing =
        (totalRuns >= 2 && failureRatePercent >= 20) || consecutiveFailures >= 2;

      // Flakiness criteria: has marked flaky status, or has retried successfully, or has alternating results
      const isFlaky = flakyRuns > 0 || (totalRuns >= 3 && passedRuns > 0 && failedRuns > 0);

      const durations = testRecords.map((t) => t.durationMs);
      const avgDurationMs = Math.round(durations.reduce((a, b) => a + b, 0) / totalRuns);

      const lastFailure = [...testRecords]
        .reverse()
        .find((t) => t.status === 'failed' || t.status === 'timedOut');

      const recentStatuses: TestStatus[] = testRecords.slice(-5).map((t) => t.status);

      allTestStats.push({
        testId: sample.testId,
        title: sample.title,
        file: sample.file,
        project: sample.project,
        totalRuns,
        passedRuns,
        failedRuns,
        flakyRuns,
        passRatePercent,
        failureRatePercent,
        consecutiveFailures,
        isFrequentlyFailing,
        isFlaky,
        avgDurationMs,
        lastFailureDate: lastFailure ? new Date().toISOString() : undefined,
        lastErrorMessage: lastFailure?.errorMessage,
        recentStatuses,
      });
    });

    // Sort frequently failing by failure rate descending and consecutive failures descending
    const frequentlyFailingTests = allTestStats
      .filter((t) => t.isFrequentlyFailing)
      .sort(
        (a, b) =>
          b.consecutiveFailures - a.consecutiveFailures ||
          b.failureRatePercent - a.failureRatePercent
      );

    // Sort flaky tests by flaky runs count descending
    const flakyTests = allTestStats
      .filter((t) => t.isFlaky && !t.isFrequentlyFailing)
      .sort((a, b) => b.flakyRuns - a.flakyRuns);

    const totalPassedAll = runs.reduce((acc, r) => acc + r.passed, 0);
    const totalExecutedAll = runs.reduce((acc, r) => acc + r.totalTests, 0);
    const overallPassRatePercent =
      totalExecutedAll > 0 ? Math.round((totalPassedAll / totalExecutedAll) * 100) : 100;

    return {
      totalRecordedRuns: runs.length,
      overallPassRatePercent,
      totalUniqueTests: allTestStats.length,
      frequentlyFailingCount: frequentlyFailingTests.length,
      flakyCount: flakyTests.length,
      frequentlyFailingTests,
      flakyTests,
      allTestStats,
      runs,
    };
  }
}
