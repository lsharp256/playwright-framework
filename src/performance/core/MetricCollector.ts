import {
  BrowserJourneyMetric,
  LatencyStats,
  MetricSummary,
  RequestMetric,
} from '../types/performance.types.js';

export class MetricCollector {
  private requestMetrics: RequestMetric[] = [];
  private browserMetrics: BrowserJourneyMetric[] = [];
  private startTime: number = Date.now();
  private endTime: number = Date.now();

  start(): void {
    this.startTime = Date.now();
    this.requestMetrics = [];
    this.browserMetrics = [];
  }

  stop(): void {
    this.endTime = Date.now();
  }

  recordRequest(metric: RequestMetric): void {
    this.requestMetrics.push(metric);
  }

  recordBrowserJourney(metric: BrowserJourneyMetric): void {
    this.browserMetrics.push(metric);
  }

  getMetrics(): RequestMetric[] {
    return this.requestMetrics;
  }

  getBrowserMetrics(): BrowserJourneyMetric[] {
    return this.browserMetrics;
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(index, sortedValues.length - 1))];
  }

  private computeLatencyStats(durations: number[]): LatencyStats {
    if (durations.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: Math.round(sum / sorted.length),
      median: Math.round(this.calculatePercentile(sorted, 50)),
      p90: Math.round(this.calculatePercentile(sorted, 90)),
      p95: Math.round(this.calculatePercentile(sorted, 95)),
      p99: Math.round(this.calculatePercentile(sorted, 99)),
    };
  }

  summarize(): MetricSummary {
    const totalRequests = this.requestMetrics.length;
    const totalDurationSeconds = Math.max(1, (this.endTime - this.startTime) / 1000);

    const successfulRequests = this.requestMetrics.filter((m) => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const errorRatePercent = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    const rps =
      totalRequests > 0 ? Math.round((totalRequests / totalDurationSeconds) * 10) / 10 : 0;

    const durations = this.requestMetrics.map((m) => m.durationMs);
    const latency = this.computeLatencyStats(durations);

    // Status code distribution
    const statusCodes: Record<number, number> = {};
    this.requestMetrics.forEach((m) => {
      statusCodes[m.statusCode] = (statusCodes[m.statusCode] || 0) + 1;
    });

    // Endpoint breakdown
    const endpointMap = new Map<string, RequestMetric[]>();
    this.requestMetrics.forEach((m) => {
      const key = `${m.method} ${m.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, []);
      }
      endpointMap.get(key)!.push(m);
    });

    const endpointBreakdown: MetricSummary['endpointBreakdown'] = {};
    endpointMap.forEach((metrics, key) => {
      const endpointDurations = metrics.map((m) => m.durationMs);
      const epLatency = this.computeLatencyStats(endpointDurations);
      const epSuccess = metrics.filter((m) => m.success).length;
      endpointBreakdown[key] = {
        count: metrics.length,
        successCount: epSuccess,
        errorCount: metrics.length - epSuccess,
        meanMs: epLatency.mean,
        p95Ms: epLatency.p95,
        minMs: epLatency.min,
        maxMs: epLatency.max,
      };
    });

    // Browser metrics summary (if applicable)
    let browserSummary: MetricSummary['browserMetrics'] = undefined;
    if (this.browserMetrics.length > 0) {
      const bDurations = this.browserMetrics.map((m) => m.durationMs);
      const avgDuration = Math.round(
        bDurations.reduce((a, b) => a + b, 0) / this.browserMetrics.length
      );

      const ttfbValues = this.browserMetrics
        .map((m) => m.webVitals?.ttfbMs)
        .filter((v): v is number => v !== undefined);
      const dclValues = this.browserMetrics
        .map((m) => m.webVitals?.domContentLoadedMs)
        .filter((v): v is number => v !== undefined);
      const loadValues = this.browserMetrics
        .map((m) => m.webVitals?.loadEventMs)
        .filter((v): v is number => v !== undefined);

      browserSummary = {
        totalJourneys: this.browserMetrics.length,
        avgJourneyDurationMs: avgDuration,
        avgTtfbMs:
          ttfbValues.length > 0
            ? Math.round(ttfbValues.reduce((a, b) => a + b, 0) / ttfbValues.length)
            : undefined,
        avgDomContentLoadedMs:
          dclValues.length > 0
            ? Math.round(dclValues.reduce((a, b) => a + b, 0) / dclValues.length)
            : undefined,
        avgLoadEventMs:
          loadValues.length > 0
            ? Math.round(loadValues.reduce((a, b) => a + b, 0) / loadValues.length)
            : undefined,
      };
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRatePercent: Math.round(errorRatePercent * 100) / 100,
      rps,
      durationSeconds: Math.round(totalDurationSeconds * 10) / 10,
      latency,
      statusCodes,
      endpointBreakdown,
      browserMetrics: browserSummary,
    };
  }
}
