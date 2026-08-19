import { HistoricalTracker } from '../src/reporting/analytics/HistoricalTracker.js';
import { NotificationManager } from '../src/reporting/notifications/NotificationManager.js';
import { NotificationPayload } from '../src/reporting/types/reporting.types.js';

async function main() {
  console.info('\n📢 Playwright Multi-Channel Notification Dispatcher');

  const tracker = new HistoricalTracker();
  const history = tracker.loadHistory();
  const summary = tracker.analyzeHistory(history);

  const lastRun = history.length > 0 ? history[history.length - 1] : undefined;

  const payload: NotificationPayload = {
    runId: lastRun?.runId || `manual-${Date.now()}`,
    status: lastRun?.status || 'PASSED',
    environment: lastRun?.environment || process.env.TEST_ENV || 'dev',
    totalTests: lastRun?.totalTests || 10,
    passed: lastRun?.passed || 10,
    failed: lastRun?.failed || 0,
    flaky: lastRun?.flaky || 0,
    skipped: lastRun?.skipped || 0,
    durationSeconds: lastRun ? Math.round(lastRun.durationMs / 1000) : 5,
    branch: lastRun?.branch || process.env.GITHUB_REF_NAME || 'main',
    commitSha: lastRun?.commitSha || process.env.GITHUB_SHA || 'manual-trigger',
    actor: lastRun?.actor || process.env.GITHUB_ACTOR || 'CI/CD Operator',
    ciRunUrl: lastRun?.ciRunUrl,
    frequentlyFailingTests: summary.frequentlyFailingTests,
    failedTestDetails: [],
  };

  const results = await NotificationManager.notifyAll(payload);

  if (!process.env.SLACK_WEBHOOK_URL && !process.env.TEAMS_WEBHOOK_URL) {
    console.info(
      'ℹ️ No SLACK_WEBHOOK_URL or TEAMS_WEBHOOK_URL environment variables configured. Set them in .env to dispatch live notifications.'
    );
  } else {
    console.info(`Notification Results: Slack: ${results.slackSent ? 'Sent' : 'Skipped/Failed'}, Teams: ${results.teamsSent ? 'Sent' : 'Skipped/Failed'}`);
  }
}

main().catch((err) => {
  console.error('Failed to run notifications script:', err);
  process.exit(1);
});
