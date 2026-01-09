import type { AppConfig } from '../shared/types.js';

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config: AppConfig = {
  port: parseInt(getEnvOrDefault('PORT', '3000'), 10),
  baseUrl: getEnvOrDefault('BASE_URL', 'http://localhost:3000'),
  nodeEnv: getEnvOrDefault('NODE_ENV', 'development') as 'development' | 'production',
  ttlMs: 10 * 60 * 1000, // 10 minutes
  maxContentLength: 50000, // 50,000 characters
  rateLimit: {
    createPerMinute: 10,
    retrievePerMinute: 5,
  },
};
