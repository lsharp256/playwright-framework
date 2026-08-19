import { NotificationPayload } from '../types/reporting.types.js';
import { SlackNotifier } from './SlackNotifier.js';
import { TeamsNotifier } from './TeamsNotifier.js';

export class NotificationManager {
  /**
   * Dispatches notifications to configured Slack and/or Microsoft Teams webhooks
   */
  static async notifyAll(payload: NotificationPayload): Promise<{
    slackSent: boolean;
    teamsSent: boolean;
  }> {
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    const teamsWebhook = process.env.TEAMS_WEBHOOK_URL;
    const slackChannel = process.env.SLACK_CHANNEL;
    const notifyOnFailureOnly =
      process.env.NOTIFY_ON_FAILURE_ONLY === 'true' || process.env.NOTIFY_ON_FAILURE_ONLY === '1';

    let slackSent = false;
    let teamsSent = false;

    // Check if notifications should be skipped on pass
    if (notifyOnFailureOnly && payload.status === 'PASSED') {
      return { slackSent: false, teamsSent: false };
    }

    if (slackWebhook) {
      slackSent = await SlackNotifier.send(slackWebhook, payload, slackChannel);
      if (slackSent) {
        console.info('📢 Slack notification successfully dispatched.');
      }
    }

    if (teamsWebhook) {
      teamsSent = await TeamsNotifier.send(teamsWebhook, payload);
      if (teamsSent) {
        console.info('📢 Microsoft Teams notification successfully dispatched.');
      }
    }

    return { slackSent, teamsSent };
  }
}
