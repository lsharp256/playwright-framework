import * as fs from 'fs';
import * as path from 'path';
import { PerformanceTestResult } from '../types/performance.types.js';

export class HtmlPerformanceReporter {
  static generateReport(
    result: PerformanceTestResult,
    outputFilePath?: string
  ): string {
    const { scenarioName, profile, vus, summary, slaResult, startTime, endTime } = result;

    const scenarioSlug = scenarioName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const resolvedPath = path.resolve(
      process.cwd(),
      outputFilePath ?? `test-results/load-report-${scenarioSlug}.html`
    );
    const outputDir = path.dirname(resolvedPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const slaStatusBadge = slaResult.passed
      ? '<span class="badge pass">SLA PASSED</span>'
      : '<span class="badge fail">SLA BREACHED</span>';

    const statusRows = Object.entries(summary.statusCodes)
      .map(
        ([code, count]) => `
      <tr>
        <td><strong>${code}</strong></td>
        <td>${count.toLocaleString()}</td>
        <td>${((count / Math.max(1, summary.totalRequests)) * 100).toFixed(1)}%</td>
      </tr>`
      )
      .join('');

    const endpointRows = Object.entries(summary.endpointBreakdown)
      .map(
        ([ep, stats]) => `
      <tr>
        <td><code>${ep}</code></td>
        <td>${stats.count.toLocaleString()}</td>
        <td class="${stats.errorCount > 0 ? 'text-danger' : ''}">${stats.errorCount}</td>
        <td>${stats.meanMs} ms</td>
        <td>${stats.p95Ms} ms</td>
        <td>${stats.minMs} / ${stats.maxMs} ms</td>
      </tr>`
      )
      .join('');

    const slaRows = slaResult.checks
      .map(
        (c) => `
      <tr>
        <td>${c.metric}</td>
        <td><code>${c.target}</code></td>
        <td><strong>${c.actual}</strong></td>
        <td><span class="badge ${c.passed ? 'pass' : 'fail'}">${c.passed ? 'PASSED' : 'FAILED'}</span></td>
      </tr>`
      )
      .join('');

    const browserSection = summary.browserMetrics
      ? `
    <div class="card">
      <h2>🧭 Browser Journey Performance</h2>
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-title">Completed Journeys</div>
          <div class="kpi-val">${summary.browserMetrics.totalJourneys}</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Avg Journey Duration</div>
          <div class="kpi-val">${summary.browserMetrics.avgJourneyDurationMs} ms</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Avg TTFB</div>
          <div class="kpi-val">${summary.browserMetrics.avgTtfbMs ?? 'N/A'} ms</div>
        </div>
        <div class="kpi">
          <div class="kpi-title">Avg DOMContentLoaded</div>
          <div class="kpi-val">${summary.browserMetrics.avgDomContentLoadedMs ?? 'N/A'} ms</div>
        </div>
      </div>
    </div>`
      : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Test Report - ${scenarioName}</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --success: #22c55e;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text-main); padding: 2rem; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--card-border); padding-bottom: 1.5rem; }
    h1 { font-size: 1.75rem; color: var(--accent); }
    .meta { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem; }
    .badge { display: inline-block; padding: 0.35rem 0.75rem; border-radius: 9999px; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; }
    .badge.pass { background-color: rgba(34, 197, 94, 0.2); color: var(--success); border: 1px solid var(--success); }
    .badge.fail { background-color: rgba(239, 68, 68, 0.2); color: var(--danger); border: 1px solid var(--danger); }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .kpi { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; padding: 1.25rem; text-align: center; }
    .kpi-title { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
    .kpi-val { font-size: 1.85rem; font-weight: 700; color: var(--text-main); }
    .kpi-val.accent { color: var(--accent); }
    .kpi-val.success { color: var(--success); }
    .kpi-val.danger { color: var(--danger); }
    .card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
    .card h2 { font-size: 1.25rem; margin-bottom: 1rem; color: var(--accent); }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--card-border); }
    th { color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; background: rgba(0,0,0,0.2); }
    tr:hover { background-color: rgba(255,255,255,0.02); }
    code { font-family: monospace; background-color: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; color: var(--accent); }
    .text-danger { color: var(--danger); font-weight: bold; }
    footer { text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 3rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🎭 Performance & Load Test Report</h1>
        <div class="meta">Scenario: <strong>${scenarioName}</strong> | Profile: <strong>${profile}</strong> | VUs: <strong>${vus}</strong></div>
        <div class="meta">Started: ${startTime} | Ended: ${endTime}</div>
      </div>
      <div>
        ${slaStatusBadge}
      </div>
    </header>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-title">Total Requests</div>
        <div class="kpi-val">${summary.totalRequests.toLocaleString()}</div>
      </div>
      <div class="kpi">
        <div class="kpi-title">Throughput</div>
        <div class="kpi-val accent">${summary.rps} <span style="font-size: 1rem;">req/s</span></div>
      </div>
      <div class="kpi">
        <div class="kpi-title">P95 Latency</div>
        <div class="kpi-val">${summary.latency.p95} <span style="font-size: 1rem;">ms</span></div>
      </div>
      <div class="kpi">
        <div class="kpi-title">Error Rate</div>
        <div class="kpi-val ${summary.errorRatePercent > 0 ? 'danger' : 'success'}">${summary.errorRatePercent}%</div>
      </div>
      <div class="kpi">
        <div class="kpi-title">Duration</div>
        <div class="kpi-val">${summary.durationSeconds}s</div>
      </div>
    </div>

    <div class="card">
      <h2>⏱️ Latency Percentiles Distribution</h2>
      <table>
        <thead>
          <tr>
            <th>Min</th>
            <th>P50 (Median)</th>
            <th>P90</th>
            <th>P95</th>
            <th>P99</th>
            <th>Max</th>
            <th>Mean Average</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>${summary.latency.min} ms</strong></td>
            <td><strong>${summary.latency.median} ms</strong></td>
            <td><strong>${summary.latency.p90} ms</strong></td>
            <td><strong>${summary.latency.p95} ms</strong></td>
            <td><strong>${summary.latency.p99} ms</strong></td>
            <td><strong>${summary.latency.max} ms</strong></td>
            <td><strong>${summary.latency.mean} ms</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    ${
      slaResult.checks.length > 0
        ? `
    <div class="card">
      <h2>🎯 SLA Target Verification</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Target SLA</th>
            <th>Actual Value</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          ${slaRows}
        </tbody>
      </table>
    </div>`
        : ''
    }

    <div class="card">
      <h2>🌐 Endpoint Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Total Requests</th>
            <th>Errors</th>
            <th>Mean Latency</th>
            <th>P95 Latency</th>
            <th>Min / Max</th>
          </tr>
        </thead>
        <tbody>
          ${endpointRows || '<tr><td colspan="6">No endpoint specific records</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>🚦 HTTP Status Codes</h2>
      <table>
        <thead>
          <tr>
            <th>Status Code</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${statusRows || '<tr><td colspan="3">No requests recorded</td></tr>'}
        </tbody>
      </table>
    </div>

    ${browserSection}

    <footer>
      Generated by Playwright Enterprise Performance Engine &bull; ${new Date().toISOString()}
    </footer>
  </div>
</body>
</html>`;

    fs.writeFileSync(resolvedPath, htmlContent, 'utf-8');

    // Also write JSON results
    const jsonPath = path.join(outputDir, `load-results-${scenarioSlug}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

    return resolvedPath;
  }
}
