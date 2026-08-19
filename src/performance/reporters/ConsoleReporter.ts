import Table from 'cli-table3';
import { PerformanceTestResult } from '../types/performance.types.js';

export class ConsoleReporter {
  static print(result: PerformanceTestResult): void {
    const { scenarioName, profile, vus, summary, slaResult } = result;

    console.info('\n' + '='.repeat(70));
    console.info(`🚀 PERFORMANCE / LOAD TEST RESULTS: ${scenarioName.toUpperCase()}`);
    console.info(`   Profile: ${profile} | Concurrent VUs: ${vus} | Duration: ${summary.durationSeconds}s`);
    console.info('='.repeat(70) + '\n');

    // 1. Core KPIs Table
    const kpiTable = new Table({
      head: ['Metric', 'Value'],
      style: { head: ['cyan'] },
    });

    kpiTable.push(
      ['Total Requests', summary.totalRequests.toLocaleString()],
      ['Successful Requests', summary.successfulRequests.toLocaleString()],
      [
        'Failed Requests',
        summary.failedRequests > 0
          ? `\x1b[31m${summary.failedRequests}\x1b[0m`
          : `${summary.failedRequests}`,
      ],
      [
        'Error Rate',
        summary.errorRatePercent > 0
          ? `\x1b[33m${summary.errorRatePercent}%\x1b[0m`
          : `${summary.errorRatePercent}%`,
      ],
      ['Throughput', `\x1b[32m${summary.rps} req/sec\x1b[0m`],
      ['Total Test Duration', `${summary.durationSeconds}s`]
    );

    console.info('📊 Throughput & Volume:');
    console.info(kpiTable.toString());

    // 2. Latency Percentiles Table
    const latencyTable = new Table({
      head: ['Min', 'Median (p50)', 'p90', 'p95', 'p99', 'Max', 'Mean'],
      style: { head: ['cyan'] },
    });

    latencyTable.push([
      `${summary.latency.min} ms`,
      `${summary.latency.median} ms`,
      `${summary.latency.p90} ms`,
      `${summary.latency.p95} ms`,
      `${summary.latency.p99} ms`,
      `${summary.latency.max} ms`,
      `${summary.latency.mean} ms`,
    ]);

    console.info('\n⏱️ Response Latency Percentiles:');
    console.info(latencyTable.toString());

    // 3. HTTP Status Codes
    const statusTable = new Table({
      head: ['HTTP Status', 'Count', 'Percentage'],
      style: { head: ['cyan'] },
    });

    Object.entries(summary.statusCodes).forEach(([code, count]) => {
      const pct =
        summary.totalRequests > 0 ? ((count / summary.totalRequests) * 100).toFixed(1) : '0';
      const color =
        code.startsWith('2') ? '\x1b[32m' : code.startsWith('3') ? '\x1b[36m' : '\x1b[31m';
      statusTable.push([`${color}${code}\x1b[0m`, count.toLocaleString(), `${pct}%`]);
    });

    console.info('\n🚦 HTTP Status Breakdown:');
    console.info(statusTable.toString());

    // 4. Endpoint Breakdown
    if (Object.keys(summary.endpointBreakdown).length > 0) {
      const epTable = new Table({
        head: ['Endpoint', 'Requests', 'Errors', 'Mean Latency', 'P95 Latency', 'Min / Max'],
        style: { head: ['cyan'] },
      });

      Object.entries(summary.endpointBreakdown).forEach(([ep, stats]) => {
        epTable.push([
          ep,
          stats.count.toLocaleString(),
          stats.errorCount > 0 ? `\x1b[31m${stats.errorCount}\x1b[0m` : '0',
          `${stats.meanMs} ms`,
          `${stats.p95Ms} ms`,
          `${stats.minMs} / ${stats.maxMs} ms`,
        ]);
      });

      console.info('\n🌐 Endpoint Breakdown:');
      console.info(epTable.toString());
    }

    // 5. Browser Metrics if present
    if (summary.browserMetrics) {
      const bTable = new Table({
        head: ['Browser Journey Metric', 'Value'],
        style: { head: ['cyan'] },
      });

      bTable.push(
        ['Total Completed Journeys', summary.browserMetrics.totalJourneys.toString()],
        ['Avg Journey Duration', `${summary.browserMetrics.avgJourneyDurationMs} ms`],
        ['Avg Time to First Byte (TTFB)', `${summary.browserMetrics.avgTtfbMs ?? 'N/A'} ms`],
        ['Avg DOMContentLoaded', `${summary.browserMetrics.avgDomContentLoadedMs ?? 'N/A'} ms`],
        ['Avg Page Load Event', `${summary.browserMetrics.avgLoadEventMs ?? 'N/A'} ms`]
      );

      console.info('\n🧭 Browser Performance:');
      console.info(bTable.toString());
    }

    // 6. SLA Evaluation Table
    if (slaResult.checks.length > 0) {
      const slaTable = new Table({
        head: ['SLA Target Rule', 'Threshold', 'Actual Measured', 'Status'],
        style: { head: ['cyan'] },
      });

      slaResult.checks.forEach((check) => {
        const statusText = check.passed ? '\x1b[32m✔ PASSED\x1b[0m' : '\x1b[31m✖ FAILED\x1b[0m';
        slaTable.push([check.metric, check.target, check.actual, statusText]);
      });

      console.info('\n🎯 SLA Threshold Verification:');
      console.info(slaTable.toString());

      const finalVerdict = slaResult.passed
        ? '\x1b[42m\x1b[30m  ✔ ALL SLA THRESHOLDS SATISFIED  \x1b[0m'
        : '\x1b[41m\x1b[37m  ✖ SLA THRESHOLDS BREACHED  \x1b[0m';
      console.info(`\n${finalVerdict}\n`);
    }
  }
}
