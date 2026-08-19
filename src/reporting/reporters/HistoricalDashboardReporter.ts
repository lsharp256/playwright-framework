import * as fs from 'fs';
import * as path from 'path';
import { HistoricalAnalyticsSummary } from '../types/reporting.types.js';

export class HistoricalDashboardReporter {
  static generateDashboard(
    summary: HistoricalAnalyticsSummary,
    outputFilePath: string = 'test-results/historical-dashboard.html'
  ): string {
    const resolvedPath = path.resolve(process.cwd(), outputFilePath);
    const outputDir = path.dirname(resolvedPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const {
      totalRecordedRuns,
      overallPassRatePercent,
      totalUniqueTests,
      frequentlyFailingCount,
      flakyCount,
      frequentlyFailingTests,
      flakyTests,
      runs,
    } = summary;

    // Build Frequently Failing Test cards/table
    const frequentFailRows = frequentlyFailingTests
      .map((t) => {
        const recentDots = t.recentStatuses
          .map((s) => {
            const color =
              s === 'passed'
                ? '#22c55e'
                : s === 'flaky'
                ? '#f59e0b'
                : s === 'skipped'
                ? '#94a3b8'
                : '#ef4444';
            return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};margin-right:4px;" title="${s}"></span>`;
          })
          .join('');

        return `
        <tr>
          <td>
            <div style="font-weight:600;color:#f87171;">${t.title}</div>
            <div style="font-size:0.8rem;color:#94a3b8;">${t.file} <span class="tag">${t.project}</span></div>
          </td>
          <td><span class="badge danger">${t.failureRatePercent}% Failure</span></td>
          <td><span class="badge warning">${t.consecutiveFailures} in a row</span></td>
          <td>${t.passedRuns} / ${t.totalRuns} passed</td>
          <td><div>${recentDots}</div></td>
          <td><code style="font-size:0.75rem;color:#fca5a5;">${t.lastErrorMessage ? t.lastErrorMessage.slice(0, 100) + '...' : 'N/A'}</code></td>
        </tr>`;
      })
      .join('');

    // Build Flaky Test cards/table
    const flakyRows = flakyTests
      .map((t) => {
        const recentDots = t.recentStatuses
          .map((s) => {
            const color =
              s === 'passed'
                ? '#22c55e'
                : s === 'flaky'
                ? '#f59e0b'
                : s === 'skipped'
                ? '#94a3b8'
                : '#ef4444';
            return `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};margin-right:4px;" title="${s}"></span>`;
          })
          .join('');

        return `
        <tr>
          <td>
            <div style="font-weight:600;color:#fbbf24;">${t.title}</div>
            <div style="font-size:0.8rem;color:#94a3b8;">${t.file} <span class="tag">${t.project}</span></div>
          </td>
          <td><span class="badge warning">${t.flakyRuns} Flaky Runs</span></td>
          <td>${t.passRatePercent}% Pass Rate</td>
          <td>${t.avgDurationMs} ms</td>
          <td><div>${recentDots}</div></td>
        </tr>`;
      })
      .join('');

    // Build Run Timeline rows
    const runRows = [...runs]
      .reverse()
      .map((r) => {
        const passPct = r.totalTests > 0 ? ((r.passed / r.totalTests) * 100).toFixed(0) : '0';
        const failPct = r.totalTests > 0 ? ((r.failed / r.totalTests) * 100).toFixed(0) : '0';
        const badge =
          r.status === 'PASSED'
            ? '<span class="badge pass">PASSED</span>'
            : '<span class="badge fail">FAILED</span>';

        return `
        <tr>
          <td><strong>${r.runId.slice(0, 16)}</strong><div style="font-size:0.75rem;color:#94a3b8;">${r.timestamp}</div></td>
          <td>${badge}</td>
          <td><span class="tag">${r.environment}</span></td>
          <td><code>${r.branch}</code> <span style="font-size:0.75rem;color:#94a3b8;">(${r.commitSha.slice(0, 7)})</span></td>
          <td>
            <div style="font-size:0.85rem;margin-bottom:4px;">${r.passed}/${r.totalTests} Passed (${passPct}%)</div>
            <div class="progress-bar">
              <div class="progress-fill pass" style="width:${passPct}%"></div>
              <div class="progress-fill fail" style="width:${failPct}%"></div>
            </div>
          </td>
          <td>${(r.durationMs / 1000).toFixed(1)}s</td>
        </tr>`;
      })
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise Test History & Flakiness Analytics</title>
  <style>
    :root {
      --bg: #0b1120;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --pass: #22c55e;
      --fail: #ef4444;
      --warn: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 2rem; line-height: 1.5; }
    .container { max-width: 1300px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; }
    h1 { font-size: 1.85rem; color: var(--accent); display: flex; align-items: center; gap: 0.5rem; }
    .subtitle { color: var(--muted); font-size: 0.95rem; margin-top: 0.25rem; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .kpi { background-color: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; text-align: center; }
    .kpi-title { font-size: 0.85rem; color: var(--muted); text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600; }
    .kpi-val { font-size: 2rem; font-weight: 800; color: var(--text); }
    .kpi-val.accent { color: var(--accent); }
    .kpi-val.pass { color: var(--pass); }
    .kpi-val.fail { color: var(--fail); }
    .kpi-val.warn { color: var(--warn); }
    .card { background-color: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem; }
    .card.danger-border { border-color: rgba(239, 68, 68, 0.5); background: linear-gradient(180deg, rgba(239,68,68,0.05) 0%, rgba(30,41,59,1) 100%); }
    .card.warn-border { border-color: rgba(245, 158, 11, 0.5); }
    .card h2 { font-size: 1.3rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border); }
    th { color: var(--muted); font-size: 0.8rem; text-transform: uppercase; background: rgba(0,0,0,0.3); }
    tr:hover { background-color: rgba(255,255,255,0.02); }
    .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 9999px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
    .badge.pass { background: rgba(34, 197, 94, 0.15); color: var(--pass); border: 1px solid var(--pass); }
    .badge.fail { background: rgba(239, 68, 68, 0.15); color: var(--fail); border: 1px solid var(--fail); }
    .badge.danger { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #f87171; }
    .badge.warning { background: rgba(245, 158, 11, 0.2); color: var(--warn); border: 1px solid var(--warn); }
    .tag { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--border); color: var(--muted); }
    code { font-family: monospace; background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; }
    .progress-bar { width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden; display: flex; }
    .progress-fill.pass { background: var(--pass); }
    .progress-fill.fail { background: var(--fail); }
    .search-box { margin-bottom: 1rem; }
    .search-box input { width: 100%; padding: 0.75rem 1rem; background: #0f172a; border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.95rem; }
    footer { text-align: center; color: var(--muted); font-size: 0.85rem; margin-top: 3rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>📈 Test Run History & Flakiness Analytics</h1>
        <div class="subtitle">Historical quality metrics, recurring failure detection, and suite health monitoring</div>
      </div>
      <div>
        <span class="badge pass">Active Tracking</span>
      </div>
    </header>

    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-title">Total Tracked Runs</div>
        <div class="kpi-val accent">${totalRecordedRuns}</div>
      </div>
      <div class="kpi">
        <div class="kpi-title">Historical Pass Rate</div>
        <div class="kpi-val ${overallPassRatePercent >= 90 ? 'pass' : overallPassRatePercent >= 75 ? 'warn' : 'fail'}">${overallPassRatePercent}%</div>
      </div>
      <div class="kpi">
        <div class="kpi-title">Unique Test Cases</div>
        <div class="kpi-val">${totalUniqueTests}</div>
      </div>
      <div class="kpi">
        <div class="kpi-title">Frequently Failing</div>
        <div class="kpi-val ${frequentlyFailingCount > 0 ? 'fail' : 'pass'}">${frequentlyFailingCount}</div>
      </div>
      <div class="kpi">
        <div class="kpi-title">Flaky Tests</div>
        <div class="kpi-val ${flakyCount > 0 ? 'warn' : 'pass'}">${flakyCount}</div>
      </div>
    </div>

    <!-- Frequently Failing Tests Highlight Section -->
    <div class="card danger-border">
      <h2>
        <span>🚨 Frequently Failing Tests (Requires Immediate Triage)</span>
        <span class="badge danger">${frequentlyFailingCount} Impacted</span>
      </h2>
      ${
        frequentlyFailingCount === 0
          ? '<p style="color:#22c55e;padding:1rem 0;">🎉 Great news! No frequently failing tests detected in recent history.</p>'
          : `
      <table>
        <thead>
          <tr>
            <th>Test Name & Location</th>
            <th>Failure Rate</th>
            <th>Consecutive Fails</th>
            <th>Historical Record</th>
            <th>Last 5 Runs</th>
            <th>Recent Error Snippet</th>
          </tr>
        </thead>
        <tbody>
          ${frequentFailRows}
        </tbody>
      </table>`
      }
    </div>

    <!-- Flaky Tests Section -->
    <div class="card warn-border">
      <h2>
        <span>⚠️ Intermittent & Flaky Tests</span>
        <span class="badge warning">${flakyCount} Identified</span>
      </h2>
      ${
        flakyCount === 0
          ? '<p style="color:#22c55e;padding:1rem 0;">✔ Zero flaky tests detected across recent executions.</p>'
          : `
      <table>
        <thead>
          <tr>
            <th>Test Name & Location</th>
            <th>Flaky Frequency</th>
            <th>Pass Rate</th>
            <th>Avg Duration</th>
            <th>Last 5 Runs</th>
          </tr>
        </thead>
        <tbody>
          ${flakyRows}
        </tbody>
      </table>`
      }
    </div>

    <!-- Run Timeline History -->
    <div class="card">
      <h2>
        <span>🗓️ Recent Test Run Executions Timeline</span>
        <span style="font-size:0.9rem;color:#94a3b8;">Showing last ${runs.length} runs</span>
      </h2>
      <table>
        <thead>
          <tr>
            <th>Run ID & Timestamp</th>
            <th>Status</th>
            <th>Environment</th>
            <th>Branch & Commit</th>
            <th>Pass / Total Ratio</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${runRows || '<tr><td colspan="6">No recorded test runs yet</td></tr>'}
        </tbody>
      </table>
    </div>

    <footer>
      Playwright Enterprise Test Intelligence &bull; Generated on ${new Date().toISOString()}
    </footer>
  </div>
</body>
</html>`;

    fs.writeFileSync(resolvedPath, htmlContent, 'utf-8');
    return resolvedPath;
  }
}
