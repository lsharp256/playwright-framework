import { LoadRunner } from '../src/performance/core/LoadRunner.js';
import { LoadProfileType, PerformanceTestResult } from '../src/performance/types/performance.types.js';
import { runAuthLoadScenario } from '../tests/load/api/auth-load.scenario.js';
import { runUsersCrudLoadScenario } from '../tests/load/api/users-crud-load.scenario.js';
import { runBrowserJourneyLoadScenario } from '../tests/load/browser/login-journey-load.scenario.js';

interface CliArgs {
  type: 'api' | 'browser' | 'all';
  profile: LoadProfileType;
  vus?: number;
  duration?: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    type: 'api',
    profile: 'load',
  };

  args.forEach((arg) => {
    if (arg.startsWith('--type=')) {
      result.type = arg.replace('--type=', '') as CliArgs['type'];
    } else if (arg.startsWith('--profile=')) {
      result.profile = arg.replace('--profile=', '') as LoadProfileType;
    } else if (arg.startsWith('--vus=')) {
      result.vus = parseInt(arg.replace('--vus=', ''), 10);
    } else if (arg.startsWith('--duration=')) {
      result.duration = parseInt(arg.replace('--duration=', ''), 10);
    }
  });

  return result;
}

async function main() {
  const { type, profile, vus, duration } = parseArgs();

  console.info('\n🎭 Playwright Enterprise Performance & Load Runner');
  console.info(`▶ Target: ${type.toUpperCase()} | Profile: ${profile.toUpperCase()}${vus ? ` | VUs: ${vus}` : ''}${duration ? ` | Duration: ${duration}s` : ''}\n`);

  const runner = new LoadRunner();
  const results: PerformanceTestResult[] = [];

  try {
    if (type === 'api' || type === 'all') {
      // Run API Load Scenarios
      const authResult = await runAuthLoadScenario(runner, {
        profile,
        vus,
        durationSeconds: duration,
      });
      results.push(authResult);

      const crudResult = await runUsersCrudLoadScenario(runner, {
        profile,
        vus,
        durationSeconds: duration,
      });
      results.push(crudResult);
    }

    if (type === 'browser' || type === 'all') {
      // Run Browser Load Scenario
      const browserResult = await runBrowserJourneyLoadScenario(runner, {
        profile,
        vus: vus || 2,
        durationSeconds: duration || 10,
      });
      results.push(browserResult);
    }

    const allPassed = results.every((r) => r.slaResult.passed);

    console.info('\n📁 HTML Performance Reports saved to: test-results/load-report-<scenario>.html');
    console.info('📁 JSON Performance Summaries saved to: test-results/load-results-<scenario>.json\n');

    if (!allPassed) {
      console.error('❌ One or more performance SLA thresholds were breached.');
      process.exit(1);
    } else {
      console.info('✅ All performance test scenarios passed SLA threshold criteria.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fatal error running performance suite:', error);
    process.exit(1);
  }
}

main();
