import * as fs from 'fs';
import * as path from 'path';

interface ArtillerySummaryStats {
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  p95?: number;
  p99?: number;
}

interface ArtilleryAggregate {
  counters: Record<string, number>;
  summaries: Record<string, ArtillerySummaryStats>;
  firstMetricAt: string;
  lastMetricAt: string;
}

interface ArtilleryReport {
  aggregate: ArtilleryAggregate;
  testMetadata?: { target?: string };
}

const INPUT_DEFAULT = 'test-results/artillery-report.json';
const OUTPUT_DEFAULT = 'test-results/artillery-report.html';

const fmt = (v: number | undefined): string =>
  v === undefined || v === null ? 'N/A' : String(Math.round(v * 10) / 10);

function render(inputPath: string, outputPath: string): void {
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Artillery results file not found: ${inputPath}`);
    console.error('   Run "npm run test:load:artillery" first.');
    process.exit(1);
  }

  const report: ArtilleryReport = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const a = report.aggregate;
  const c = a.counters;
  const s = a.summaries;

  const rt = s['http.response_time'] || {};
  const sl = s['vusers.session_length'] || {};

  const requests = c['http.requests'] || 0;
  const responses = c['http.responses'] || 0;
  const failed = c['vusers.failed'] || 0;
  const created = c['vusers.created'] || 0;
  const errorRate = created > 0 ? (failed / created) * 100 : 0;
  const durationSec = Math.max(
    1,
    Math.round((new Date(a.lastMetricAt).getTime() - new Date(a.firstMetricAt).getTime()) / 1000)
  );
  const rps = (requests / durationSec).toFixed(1);

  const endpointStats = Object.entries(c)
    .filter(([k]) => k.startsWith('plugins.metrics-by-endpoint.') && k.includes('.codes.'))
    .map(([k, count]) => {
      const ep = k.replace('plugins.metrics-by-endpoint.', '').replace(/\.codes\.\d+$/, '');
      const st = s[`plugins.metrics-by-endpoint.response_time.${ep}`] || {};
      return { ep, count, st };
    });

  const slaP95Passed = (rt.p95 || 0) <= 1500;
  const slaErrorRatePassed = errorRate <= 2;
  const slaPassed = slaP95Passed && slaErrorRatePassed;

  const statusRows = Object.entries(c)
    .filter(([k]) => /^http\.codes\.\d+$/.test(k))
    .map(
      ([k, count]) => `
    <tr>
      <td><strong>${k.split('.').pop()}</strong></td>
      <td>${count.toLocaleString()}</td>
      <td>${((count / Math.max(1, responses)) * 100).toFixed(1)}%</td>
    </tr>`
    )
    .join('');

  const endpointRows = endpointStats
    .map(
      (e) => `
    <tr>
      <td><code>${e.ep}</code></td>
      <td>${e.count.toLocaleString()}</td>
      <td>${fmt(e.st.mean)} ms</td>
      <td>${fmt(e.st.p95)} ms</td>
      <td>${fmt(e.st.min)} / ${fmt(e.st.max)} ms</td>
    </tr>`
    )
    .join('');

  const badge = (passed: boolean) =>
    `<span class="badge ${passed ? 'pass' : 'fail'}">${passed ? 'PASSED' : 'FAILED'}</span>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artillery Load Test Report</title>
  <style>
    :root { --bg:#0f172a; --card-bg:#1e293b; --card-border:#334155; --text-main:#f8fafc; --text-muted:#94a3b8; --accent:#38bdf8; --success:#22c55e; --danger:#ef4444; }
    * { box-sizing:border-box; margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
    body { background-color:var(--bg); color:var(--text-main); padding:2rem; line-height:1.5; }
    .container { max-width:1200px; margin:0 auto; }
    header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; border-bottom:1px solid var(--card-border); padding-bottom:1.5rem; }
    h1 { font-size:1.75rem; color:var(--accent); }
    .meta { color:var(--text-muted); font-size:0.9rem; margin-top:0.25rem; }
    .badge { display:inline-block; padding:0.35rem 0.75rem; border-radius:9999px; font-weight:700; font-size:0.85rem; text-transform:uppercase; }
    .badge.pass { background-color:rgba(34,197,94,0.2); color:var(--success); border:1px solid var(--success); }
    .badge.fail { background-color:rgba(239,68,68,0.2); color:var(--danger); border:1px solid var(--danger); }
    .kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:2rem; }
    .kpi { background-color:var(--card-bg); border:1px solid var(--card-border); border-radius:8px; padding:1.25rem; text-align:center; }
    .kpi-title { font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.5rem; }
    .kpi-val { font-size:1.85rem; font-weight:700; }
    .kpi-val.accent { color:var(--accent); }
    .kpi-val.success { color:var(--success); }
    .card { background-color:var(--card-bg); border:1px solid var(--card-border); border-radius:8px; padding:1.5rem; margin-bottom:2rem; }
    .card h2 { font-size:1.25rem; margin-bottom:1rem; color:var(--accent); }
    table { width:100%; border-collapse:collapse; text-align:left; }
    th, td { padding:0.75rem 1rem; border-bottom:1px solid var(--card-border); }
    th { color:var(--text-muted); font-size:0.85rem; text-transform:uppercase; background:rgba(0,0,0,0.2); }
    code { font-family:monospace; background-color:#0f172a; padding:0.2rem 0.4rem; border-radius:4px; color:var(--accent); }
    footer { text-align:center; color:var(--text-muted); font-size:0.85rem; margin-top:3rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🎭 Artillery Load Test Report</h1>
        <div class="meta">Scenario: <strong>Auth and User CRUD Transaction Flow</strong> | Target: <strong>${report.testMetadata?.target || 'artillery-api.yml'}</strong></div>
        <div class="meta">Started: ${a.firstMetricAt} | Ended: ${a.lastMetricAt}</div>
      </div>
      <div>
        ${badge(slaPassed)}
      </div>
    </header>

    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-title">Total Requests</div><div class="kpi-val">${requests.toLocaleString()}</div></div>
      <div class="kpi"><div class="kpi-title">Throughput</div><div class="kpi-val accent">${rps} <span style="font-size:1rem;">req/s</span></div></div>
      <div class="kpi"><div class="kpi-title">P95 Latency</div><div class="kpi-val">${fmt(rt.p95)} <span style="font-size:1rem;">ms</span></div></div>
      <div class="kpi"><div class="kpi-title">Failed VUs</div><div class="kpi-val ${failed > 0 ? 'accent' : 'success'}">${failed}</div></div>
      <div class="kpi"><div class="kpi-title">VUs Created</div><div class="kpi-val">${created.toLocaleString()}</div></div>
    </div>

    <div class="card">
      <h2>⏱️ Latency Percentiles Distribution</h2>
      <table>
        <thead><tr><th>Min</th><th>P50 (Median)</th><th>Mean</th><th>P95</th><th>P99</th><th>Max</th></tr></thead>
        <tbody>
          <tr>
            <td><strong>${fmt(rt.min)} ms</strong></td>
            <td><strong>${fmt(rt.median)} ms</strong></td>
            <td><strong>${fmt(rt.mean)} ms</strong></td>
            <td><strong>${fmt(rt.p95)} ms</strong></td>
            <td><strong>${fmt(rt.p99)} ms</strong></td>
            <td><strong>${fmt(rt.max)} ms</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>🎯 SLA Target Verification (ensure block)</h2>
      <table>
        <thead><tr><th>Metric</th><th>Target SLA</th><th>Actual Value</th><th>Result</th></tr></thead>
        <tbody>
          <tr><td>P95 Response Time</td><td><code>&lt;= 1500 ms</code></td><td><strong>${fmt(rt.p95)} ms</strong></td><td>${badge(slaP95Passed)}</td></tr>
          <tr><td>Max Error Rate</td><td><code>&lt;= 2%</code></td><td><strong>${Math.round(errorRate * 10) / 10}%</strong></td><td>${badge(slaErrorRatePassed)}</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>🌐 Endpoint Breakdown</h2>
      <table>
        <thead><tr><th>Endpoint</th><th>Requests</th><th>Mean Latency</th><th>P95 Latency</th><th>Min / Max</th></tr></thead>
        <tbody>${endpointRows || '<tr><td colspan="5">No endpoint records</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>🚦 HTTP Status Codes</h2>
      <table>
        <thead><tr><th>Status Code</th><th>Count</th><th>Percentage</th></tr></thead>
        <tbody>${statusRows || '<tr><td colspan="3">No responses recorded</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>👤 Virtual User Sessions</h2>
      <table>
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>VUs Created</td><td>${created.toLocaleString()}</td></tr>
          <tr><td>VUs Completed</td><td>${(c['vusers.completed'] || 0).toLocaleString()}</td></tr>
          <tr><td>VUs Failed</td><td>${failed}</td></tr>
          <tr><td>Avg Session Length</td><td>${fmt(sl.mean)} ms</td></tr>
          <tr><td>P95 Session Length</td><td>${fmt(sl.p95)} ms</td></tr>
        </tbody>
      </table>
    </div>

    <footer>Generated from ${path.basename(inputPath)} &bull; ${new Date().toISOString()}</footer>
  </div>
</body>
</html>`;

  const resolvedOutput = path.resolve(process.cwd(), outputPath);
  fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
  fs.writeFileSync(resolvedOutput, html, 'utf-8');

  console.info(`📁 Artillery HTML report saved to: ${outputPath}`);
}

const args = process.argv.slice(2);
const inputArg = args.find((a) => a.startsWith('--input='));
const outputArg = args.find((a) => a.startsWith('--output='));

render(inputArg?.replace('--input=', '') || INPUT_DEFAULT, outputArg?.replace('--output=', '') || OUTPUT_DEFAULT);
