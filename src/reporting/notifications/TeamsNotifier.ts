import { NotificationPayload } from '../types/reporting.types.js';

export class TeamsNotifier {
  /**
   * Sends an Adaptive Card / MessageCard notification to a Microsoft Teams incoming webhook
   */
  static async send(webhookUrl: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const isPassed = payload.status === 'PASSED';
      const themeColor = isPassed ? '22c55e' : 'ef4444';
      const statusTitle = `${isPassed ? '✅' : '❌'} Playwright Test Run: ${payload.status} [${payload.environment.toUpperCase()}]`;

      const facts: { name: string; value: string }[] = [
        { name: 'Environment', value: payload.environment },
        {
          name: 'Results',
          value: `${payload.passed} passed, ${payload.failed} failed, ${payload.flaky} flaky (Total: ${payload.totalTests})`,
        },
        { name: 'Duration', value: `${payload.durationSeconds}s` },
        { name: 'Branch', value: payload.branch },
        { name: 'Commit', value: `${payload.commitSha.slice(0, 7)} by ${payload.actor}` },
      ];

      const sections: any[] = [
        {
          activityTitle: statusTitle,
          activitySubtitle: `Executed on ${new Date().toLocaleString()}`,
          facts,
          markdown: true,
        },
      ];

      // Add Frequently Failing section if present
      if (payload.frequentlyFailingTests.length > 0) {
        const text = payload.frequentlyFailingTests
          .slice(0, 3)
          .map(
            (t) =>
              `- **${t.title}** (${t.failureRatePercent}% fail rate, ${t.consecutiveFailures} consecutive)\n  \`${t.file}\``
          )
          .join('\n');

        sections.push({
          title: '⚠️ Frequently Failing Tests Detected',
          text,
          markdown: true,
        });
      }

      // Add Failed Tests details if any
      if (payload.failedTestDetails.length > 0) {
        const text = payload.failedTestDetails
          .slice(0, 5)
          .map(
            (f) =>
              `- **${f.title}** ${f.isRecurring ? '*(Recurring!)*' : ''}\n  \`${f.file}\`\n  _${(f.error || 'Unknown error').slice(0, 120)}_`
          )
          .join('\n\n');

        sections.push({
          title: '❌ Failed Tests Summary',
          text,
          markdown: true,
        });
      }

      const potentialAction: any[] = [];
      if (payload.ciRunUrl) {
        potentialAction.push({
          '@type': 'OpenUri',
          name: 'View CI Pipeline',
          targets: [{ os: 'default', uri: payload.ciRunUrl }],
        });
      }
      if (payload.reportUrl) {
        potentialAction.push({
          '@type': 'OpenUri',
          name: 'View HTML Report',
          targets: [{ os: 'default', uri: payload.reportUrl }],
        });
      }

      const messageCard = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor,
        summary: statusTitle,
        sections,
        potentialAction: potentialAction.length > 0 ? potentialAction : undefined,
      };

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageCard),
      });

      return res.ok;
    } catch (err) {
      console.error('Failed to dispatch Microsoft Teams notification:', err);
      return false;
    }
  }
}
