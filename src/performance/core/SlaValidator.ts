import {
  MetricSummary,
  SlaCheckItem,
  SlaEvaluationResult,
  SlaThresholds,
} from '../types/performance.types.js';

export class SlaValidator {
  static evaluate(summary: MetricSummary, thresholds?: SlaThresholds): SlaEvaluationResult {
    if (!thresholds) {
      return { passed: true, checks: [] };
    }

    const checks: SlaCheckItem[] = [];

    // Check P95 Latency
    if (thresholds.p95MaxMs !== undefined) {
      const passed = summary.latency.p95 <= thresholds.p95MaxMs;
      checks.push({
        metric: 'P95 Response Time',
        target: `<= ${thresholds.p95MaxMs} ms`,
        actual: `${summary.latency.p95} ms`,
        passed,
      });
    }

    // Check P99 Latency
    if (thresholds.p99MaxMs !== undefined) {
      const passed = summary.latency.p99 <= thresholds.p99MaxMs;
      checks.push({
        metric: 'P99 Response Time',
        target: `<= ${thresholds.p99MaxMs} ms`,
        actual: `${summary.latency.p99} ms`,
        passed,
      });
    }

    // Check P90 Latency
    if (thresholds.p90MaxMs !== undefined) {
      const passed = summary.latency.p90 <= thresholds.p90MaxMs;
      checks.push({
        metric: 'P90 Response Time',
        target: `<= ${thresholds.p90MaxMs} ms`,
        actual: `${summary.latency.p90} ms`,
        passed,
      });
    }

    // Check P50 / Median Latency
    if (thresholds.p50MaxMs !== undefined) {
      const passed = summary.latency.median <= thresholds.p50MaxMs;
      checks.push({
        metric: 'P50 (Median) Response Time',
        target: `<= ${thresholds.p50MaxMs} ms`,
        actual: `${summary.latency.median} ms`,
        passed,
      });
    }

    // Check Mean Latency
    if (thresholds.maxMeanLatencyMs !== undefined) {
      const passed = summary.latency.mean <= thresholds.maxMeanLatencyMs;
      checks.push({
        metric: 'Mean Response Time',
        target: `<= ${thresholds.maxMeanLatencyMs} ms`,
        actual: `${summary.latency.mean} ms`,
        passed,
      });
    }

    // Check Max Error Rate
    if (thresholds.maxErrorRatePercent !== undefined) {
      const passed = summary.errorRatePercent <= thresholds.maxErrorRatePercent;
      checks.push({
        metric: 'Error Rate',
        target: `<= ${thresholds.maxErrorRatePercent}%`,
        actual: `${summary.errorRatePercent}%`,
        passed,
      });
    }

    // Check Min Throughput (RPS)
    if (thresholds.minThroughputRps !== undefined) {
      const passed = summary.rps >= thresholds.minThroughputRps;
      checks.push({
        metric: 'Throughput (RPS)',
        target: `>= ${thresholds.minThroughputRps} req/s`,
        actual: `${summary.rps} req/s`,
        passed,
      });
    }

    const allPassed = checks.every((c) => c.passed);

    return {
      passed: allPassed,
      checks,
    };
  }
}
