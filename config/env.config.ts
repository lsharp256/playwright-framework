import * as dotenv from 'dotenv';
import * as path from 'path';
import { z } from 'zod';

const currentEnv = process.env.TEST_ENV || 'dev';
const envFilePath = path.resolve(process.cwd(), `.env.${currentEnv}`);

// Load specific env file with fallback to root .env
dotenv.config({ path: envFilePath });
dotenv.config(); // fallback

const envSchema = z.object({
  TEST_ENV: z.enum(['dev', 'staging', 'prod', 'local']).default('dev'),
  BASE_URL: z.string().url().default('https://automationexercise.com'),
  API_URL: z.string().url().default('https://dummyjson.com'),
  ADMIN_EMAIL: z.string().email().default('admin@framework.test'),
  ADMIN_PASSWORD: z.string().min(6).default('FrameworkAdmin123!'),
  STANDARD_USER_EMAIL: z.string().email().default('user@framework.test'),
  STANDARD_USER_PASSWORD: z.string().min(6).default('StandardUser123!'),
  HEADLESS: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  DEFAULT_TIMEOUT: z.preprocess((val) => (val ? Number(val) : 30000), z.number()).default(30000),
  EXPECT_TIMEOUT: z.preprocess((val) => (val ? Number(val) : 10000), z.number()).default(10000),
  RETRIES: z.preprocess((val) => (val !== undefined ? Number(val) : 0), z.number()).default(0),
  WORKERS: z.preprocess((val) => (val ? Number(val) : 4), z.number()).default(4),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CAPTURE_HAR: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  VIEWPORT_WIDTH: z.preprocess((val) => (val ? Number(val) : 1920), z.number()).default(1920),
  VIEWPORT_HEIGHT: z.preprocess((val) => (val ? Number(val) : 1080), z.number()).default(1080),
  // Performance & Load Testing Parameters
  LOAD_TEST_VUS: z.preprocess((val) => (val ? Number(val) : 10), z.number()).default(10),
  LOAD_TEST_DURATION: z.preprocess((val) => (val ? Number(val) : 20), z.number()).default(20),
  LOAD_TEST_RAMP_UP: z.preprocess((val) => (val ? Number(val) : 5), z.number()).default(5),
  LOAD_TEST_SLA_P95_MS: z.preprocess((val) => (val ? Number(val) : 1000), z.number()).default(1000),
  LOAD_TEST_SLA_ERROR_RATE: z.preprocess((val) => (val ? Number(val) : 1.0), z.number()).default(1.0),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:', result.error.format());
    throw new Error('Environment configuration validation failed');
  }
  return result.data;
};

export const ENV = parseEnv();
export type EnvironmentConfig = z.infer<typeof envSchema>;
