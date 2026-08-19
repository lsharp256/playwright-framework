import winston from 'winston';
import { test } from '@playwright/test';
import { ENV } from '../../../config/env.config.js';

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `[${timestamp}] [${level.toUpperCase().padEnd(5)}]: ${message}`;
    if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

export const winstonLogger = winston.createLogger({
  level: ENV.LOG_LEVEL,
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), customFormat),
    }),
    new winston.transports.File({
      filename: 'logs/test-execution.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

export class Logger {
  private context: string;

  constructor(context: string = 'Test') {
    this.context = context;
  }

  info(message: string, ...args: any[]): void {
    winstonLogger.info(`[${this.context}] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    winstonLogger.debug(`[${this.context}] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    winstonLogger.warn(`[${this.context}] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    winstonLogger.error(`[${this.context}] ${message}`, ...args);
  }

  /**
   * Executes an action inside a Playwright test.step (if in test runner) and logs the step description.
   */
  async step<T>(stepName: string, action: () => Promise<T>): Promise<T> {
    this.info(`➡️ STEP: ${stepName}`);
    try {
      if (test.info()) {
        return await test.step(stepName, async () => {
          try {
            const result = await action();
            this.info(`✔️ COMPLETED: ${stepName}`);
            return result;
          } catch (error) {
            this.error(`❌ FAILED: ${stepName} - ${(error as Error).message}`);
            throw error;
          }
        });
      }
    } catch {
      // Outside Playwright test worker context (e.g. standalone load runner)
    }

    try {
      const result = await action();
      this.info(`✔️ COMPLETED: ${stepName}`);
      return result;
    } catch (error) {
      this.error(`❌ FAILED: ${stepName} - ${(error as Error).message}`);
      throw error;
    }
  }
}

export const logger = new Logger('App');
