import { Page, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { A11yScanOptions } from '../types/global.js';
import { Logger } from '../core/logger/logger.js';

export class A11yHelper {
  private page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('A11yHelper');
  }

  /**
   * Scans the current page or scoped element for accessibility (WCAG) violations
   */
  async scan(options: A11yScanOptions = {}) {
    const {
      wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      includedImpacts = ['critical', 'serious'],
      scope,
      exclude = [],
    } = options;

    return await this.logger.step('Run WCAG Accessibility Scan', async () => {
      let builder = new AxeBuilder({ page: this.page }).withTags(wcagTags);

      if (scope) {
        builder = builder.include(scope);
      }

      for (const ex of exclude) {
        builder = builder.exclude(ex);
      }

      const results = await builder.analyze();
      const violations = results.violations.filter((v: any) => includedImpacts.includes(v.impact));

      if (violations.length > 0) {
        const formattedViolations = violations.map((v: any) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.map((n: any) => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary,
          })),
        }));

        this.logger.error(
          `Found ${violations.length} accessibility violation(s):`,
          formattedViolations
        );
      } else {
        this.logger.info(`✅ Accessibility scan passed with 0 critical/serious violations.`);
      }

      return {
        violations,
        passesCount: results.passes.length,
        inapplicableCount: results.inapplicable.length,
      };
    });
  }

  /**
   * Asserts that no critical or serious accessibility violations exist
   */
  async assertZeroViolations(options: A11yScanOptions = {}): Promise<void> {
    const result = await this.scan(options);
    expect(
      result.violations,
      `Expected 0 accessibility violations, but found ${result.violations.length}`
    ).toEqual([]);
  }
}
