import { chromium, request as playwrightRequest } from '@playwright/test';
import { Logger } from '../../core/logger/logger.js';
import { ENV } from '../../../config/env.config.js';
import { clientConfig } from '../../../config/client.config.js';
import {
  ApiTaskFunction,
  BrowserTaskFunction,
  BrowserWebVitals,
  LoadProfileType,
  LoadStage,
  LoadTestConfig,
  PerformanceTestResult,
  SlaThresholds,
} from '../types/performance.types.js';
import { MetricCollector } from './MetricCollector.js';
import { SlaValidator } from './SlaValidator.js';
import { ConsoleReporter } from '../reporters/ConsoleReporter.js';
import { HtmlPerformanceReporter } from '../reporters/HtmlPerformanceReporter.js';

export class LoadRunner {
  private logger: Logger;
  private collector: MetricCollector;

  constructor() {
    this.logger = new Logger('LoadRunner');
    this.collector = new MetricCollector();
  }

  /**
   * Resolves stages based on preset profile or explicit configuration
   */
  private resolveStages(config: LoadTestConfig): LoadStage[] {
    if (config.stages && config.stages.length > 0) {
      return config.stages;
    }

    const vus = config.vus ?? ENV.LOAD_TEST_VUS ?? 10;
    const duration = config.durationSeconds ?? ENV.LOAD_TEST_DURATION ?? 20;
    const rampUp = config.rampUpSeconds ?? ENV.LOAD_TEST_RAMP_UP ?? 5;
    const profile: LoadProfileType = config.profile ?? 'load';

    switch (profile) {
      case 'smoke':
        return [{ targetVus: 2, durationSeconds: Math.min(duration, 10) }];

      case 'stress':
        return [
          { targetVus: Math.round(vus * 0.5), durationSeconds: rampUp },
          { targetVus: vus, durationSeconds: Math.round(duration * 0.5) },
          { targetVus: Math.round(vus * 2), durationSeconds: Math.round(duration * 0.3) },
          { targetVus: Math.round(vus * 3), durationSeconds: Math.round(duration * 0.2) },
        ];

      case 'spike':
        return [
          { targetVus: Math.round(vus * 0.2), durationSeconds: Math.round(duration * 0.2) },
          { targetVus: Math.round(vus * 3), durationSeconds: Math.round(duration * 0.4) },
          { targetVus: Math.round(vus * 0.2), durationSeconds: Math.round(duration * 0.4) },
        ];

      case 'soak':
        return [
          { targetVus: vus, durationSeconds: rampUp },
          { targetVus: vus, durationSeconds: Math.max(duration, 60) },
        ];

      case 'load':
      default:
        return [
          { targetVus: vus, durationSeconds: rampUp },
          { targetVus: vus, durationSeconds: Math.max(5, duration - rampUp) },
        ];
    }
  }

  /**
   * Runs an API load test scenario
   */
  async runApiLoadTest(
    config: LoadTestConfig,
    task: ApiTaskFunction
  ): Promise<PerformanceTestResult> {
    this.logger.info(`Starting API Load Test: ${config.scenarioName}`);
    const stages = this.resolveStages(config);
    const maxVus = Math.max(...stages.map((s) => s.targetVus));
    const totalDurationSec = stages.reduce((acc, s) => acc + s.durationSeconds, 0);

    this.logger.info(
      `Execution Plan: ${stages.length} stages, Peak VUs: ${maxVus}, Total Duration: ${totalDurationSec}s`
    );

    const startTime = new Date().toISOString();
    this.collector.start();

    // Shared or dedicated request context
    const requestContext = await playwrightRequest.newContext({
      baseURL: ENV.API_URL,
      extraHTTPHeaders: clientConfig.defaultHeaders,
    });

    let isRunning = true;
    let currentVus = 0;

    // Concurrency controller loop
    const runWorker = async (vuId: number) => {
      let iteration = 0;
      while (isRunning && vuId <= currentVus) {
        iteration++;
        const iterationStart = Date.now();
        const metricsBefore = this.collector.getMetrics().length;
        try {
          await task({ vuId, requestContext, iteration });
        } catch (error) {
          const errorMessage = (error as Error).message;
          this.logger.warn(`VU #${vuId} error in iteration ${iteration}: ${errorMessage}`);

          const newMetrics = this.collector.getMetrics().slice(metricsBefore);
          const failureAlreadyRecorded = newMetrics.some((m) => !m.success);
          if (!failureAlreadyRecorded) {
            this.collector.recordRequest({
              endpoint: config.scenarioName,
              method: 'TASK',
              statusCode: 500,
              durationMs: Date.now() - iterationStart,
              timestamp: iterationStart,
              success: false,
              error: errorMessage,
              vuId,
            });
          }
        }

        if (config.thinkTimeMs && config.thinkTimeMs > 0) {
          await new Promise((r) => setTimeout(r, config.thinkTimeMs));
        }
      }
    };

    // Stage execution scheduler
    const workerPromises: Set<Promise<void>> = new Set();

    const updateVus = (targetVus: number) => {
      const prevVus = currentVus;
      currentVus = targetVus;

      if (targetVus > prevVus) {
        for (let i = prevVus + 1; i <= targetVus; i++) {
          const promise = runWorker(i).finally(() => workerPromises.delete(promise));
          workerPromises.add(promise);
        }
      }
    };

    for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
      const stage = stages[stageIdx];
      this.logger.info(
        `▶ Stage ${stageIdx + 1}/${stages.length}: Target ${stage.targetVus} VUs for ${stage.durationSeconds}s`
      );
      updateVus(stage.targetVus);
      await new Promise((r) => setTimeout(r, stage.durationSeconds * 1000));
    }

    isRunning = false;
    currentVus = 0;

    // Allow graceful completion of in-flight requests (up to 3s)
    await Promise.race([
      Promise.all(Array.from(workerPromises)),
      new Promise((r) => setTimeout(r, 3000)),
    ]);

    await requestContext.dispose();
    this.collector.stop();

    const endTime = new Date().toISOString();
    const summary = this.collector.summarize();

    const slaThresholds: SlaThresholds = {
      p95MaxMs: config.sla?.p95MaxMs ?? clientConfig.performance.targetSla.p95MaxMs,
      p99MaxMs: config.sla?.p99MaxMs ?? clientConfig.performance.targetSla.p99MaxMs,
      maxErrorRatePercent:
        config.sla?.maxErrorRatePercent ?? clientConfig.performance.targetSla.maxErrorRatePercent,
      minThroughputRps:
        config.sla?.minThroughputRps ?? clientConfig.performance.targetSla.minThroughputRps,
    };

    const slaResult = SlaValidator.evaluate(summary, slaThresholds);

    const testResult: PerformanceTestResult = {
      scenarioName: config.scenarioName,
      profile: config.profile ?? 'load',
      vus: maxVus,
      startTime,
      endTime,
      summary,
      slaResult,
    };

    ConsoleReporter.print(testResult);
    HtmlPerformanceReporter.generateReport(testResult);

    return testResult;
  }

  /**
   * Runs a multi-user Browser load journey scenario
   */
  async runBrowserLoadTest(
    config: LoadTestConfig,
    task: BrowserTaskFunction
  ): Promise<PerformanceTestResult> {
    this.logger.info(`Starting Browser Load Test: ${config.scenarioName}`);
    const stages = this.resolveStages(config);
    const maxVus = Math.max(...stages.map((s) => s.targetVus));
    const totalDurationSec = stages.reduce((acc, s) => acc + s.durationSeconds, 0);

    this.logger.info(
      `Execution Plan: ${stages.length} stages, Peak Browser VUs: ${maxVus}, Duration: ${totalDurationSec}s`
    );

    const startTime = new Date().toISOString();
    this.collector.start();

    const browser = await chromium.launch({
      headless: ENV.HEADLESS,
    });

    let isRunning = true;
    let currentVus = 0;
    const workerPromises: Set<Promise<void>> = new Set();

    const runBrowserWorker = async (vuId: number) => {
      let iteration = 0;
      const context = await browser.newContext({
        baseURL: ENV.BASE_URL,
        viewport: { width: ENV.VIEWPORT_WIDTH, height: ENV.VIEWPORT_HEIGHT },
      });
      const page = await context.newPage();

      try {
        while (isRunning && vuId <= currentVus) {
          iteration++;
          const journeyStart = Date.now();
          let success = true;
          let errorMessage: string | undefined;
          let webVitals: BrowserWebVitals;

          try {
            webVitals = (await task({ vuId, page, iteration })) || undefined;
          } catch (err) {
            success = false;
            errorMessage = (err as Error).message;
            this.logger.warn(
              `Browser VU #${vuId} error in iteration ${iteration}: ${errorMessage}`
            );
          }

          const durationMs = Date.now() - journeyStart;

          // Record synthetic metric for the browser journey
          this.collector.recordRequest({
            endpoint: config.scenarioName,
            method: 'BROWSER',
            statusCode: success ? 200 : 500,
            durationMs,
            timestamp: Date.now(),
            success,
            error: errorMessage,
            vuId,
          });

          this.collector.recordBrowserJourney({
            journeyName: config.scenarioName,
            stepName: `Iteration-${iteration}`,
            durationMs,
            timestamp: Date.now(),
            success,
            error: errorMessage,
            vuId,
            webVitals,
          });

          if (config.thinkTimeMs && config.thinkTimeMs > 0) {
            await new Promise((r) => setTimeout(r, config.thinkTimeMs));
          }
        }
      } finally {
        await context.close().catch(() => {});
      }
    };

    const updateVus = (targetVus: number) => {
      const prevVus = currentVus;
      currentVus = targetVus;

      if (targetVus > prevVus) {
        for (let i = prevVus + 1; i <= targetVus; i++) {
          const promise = runBrowserWorker(i).finally(() => workerPromises.delete(promise));
          workerPromises.add(promise);
        }
      }
    };

    for (let stageIdx = 0; stageIdx < stages.length; stageIdx++) {
      const stage = stages[stageIdx];
      this.logger.info(
        `▶ Browser Stage ${stageIdx + 1}/${stages.length}: Target ${stage.targetVus} VUs for ${stage.durationSeconds}s`
      );
      updateVus(stage.targetVus);
      await new Promise((r) => setTimeout(r, stage.durationSeconds * 1000));
    }

    isRunning = false;
    currentVus = 0;

    await Promise.race([
      Promise.all(Array.from(workerPromises)),
      new Promise((r) => setTimeout(r, 5000)),
    ]);

    await browser.close().catch(() => {});
    this.collector.stop();

    const endTime = new Date().toISOString();
    const summary = this.collector.summarize();

    const slaThresholds: SlaThresholds = {
      p95MaxMs: config.sla?.p95MaxMs ?? 5000,
      p99MaxMs: config.sla?.p99MaxMs ?? 8000,
      maxErrorRatePercent: config.sla?.maxErrorRatePercent ?? 5.0,
      minThroughputRps: config.sla?.minThroughputRps ?? 0.5,
    };

    const slaResult = SlaValidator.evaluate(summary, slaThresholds);

    const testResult: PerformanceTestResult = {
      scenarioName: config.scenarioName,
      profile: config.profile ?? 'load',
      vus: maxVus,
      startTime,
      endTime,
      summary,
      slaResult,
    };

    ConsoleReporter.print(testResult);
    HtmlPerformanceReporter.generateReport(testResult);

    return testResult;
  }

  getCollector(): MetricCollector {
    return this.collector;
  }
}
