import { NotificationPayload } from '../types/reporting.types.js';

export class SlackNotifier {
  /**
   * Sends a rich Block Kit notification to a Slack incoming webhook
   */
  static async send(
    webhookUrl: string,
    payload: NotificationPayload,
    channel?: string
  ): Promise<boolean> {
    try {
      const isPassed = payload.status === 'PASSED';
      const statusEmoji = isPassed ? '🟢' : '🔴';
      const headerText = `${statusEmoji} Playwright Test Suite ${payload.status}: [${payload.environment.toUpperCase()}]`;

      const blocks: any[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: headerText,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Environment:*\n\`${payload.environment}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Duration:*\n${payload.durationSeconds}s`,
            },
            {
              type: 'mrkdwn',
              text: `*Passed / Total:*\n${payload.passed} / ${payload.totalTests} (${payload.totalTests > 0 ? Math.round((payload.passed / payload.totalTests) * 100) : 0}%)`,
            },
            {
              type: 'mrkdwn',
              text: `*Failed / Flaky:*\n*${payload.failed}* failed, ${payload.flaky} flaky`,
            },
            {
              type: 'mrkdwn',
              text: `*Branch:*\n\`${payload.branch}\``,
            },
            {
              type: 'mrkdwn',
              text: `*Commit / Actor:*\n\`${payload.commitSha.slice(0, 7)}\` by ${payload.actor}`,
            },
          ],
        },
      ];

      // Highlight Frequently Failing Tests if present
      if (payload.frequentlyFailingTests.length > 0) {
        const frequentList = payload.frequentlyFailingTests
          .slice(0, 3)
          .map(
            (t) =>
              `• *${t.title}* (${t.failureRatePercent}% fail rate, ${t.consecutiveFailures} consecutive fails)\n  _\`${t.file}\`_`
          )
          .join('\n');

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ *Frequently Failing Tests Detected (${payload.frequentlyFailingTests.length} tests):*\n${frequentList}`,
          },
        });
      }

      // Highlight Failed Tests Details
      if (payload.failedTestDetails.length > 0) {
        const failedItems = payload.failedTestDetails
          .slice(0, 5)
          .map(
            (f) =>
              `❌ *${f.title}* ${f.isRecurring ? '*(Recurring!)*' : ''}\n_\`${f.file}\`_\n>${(f.error || 'Unknown error').slice(0, 150)}`
          )
          .join('\n\n');

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Failed Tests Summary:*\n${failedItems}`,
          },
        });
      }

      // Action links
      const elements: any[] = [];
      if (payload.ciRunUrl) {
        elements.push({
          type: 'button',
          text: { type: 'plain_text', text: 'View CI Run ↗' },
          url: payload.ciRunUrl,
        });
      }
      if (payload.reportUrl) {
        elements.push({
          type: 'button',
          text: { type: 'plain_text', text: 'View HTML Report ↗' },
          url: payload.reportUrl,
        });
      }

      if (elements.length > 0) {
        blocks.push({
          type: 'actions',
          elements,
        });
      }

      const body: any = { blocks };
      if (channel) {
        body.channel = channel;
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return res.ok;
    } catch (err) {
      console.error('Failed to dispatch Slack notification:', err);
      return false;
    }
  }
}
