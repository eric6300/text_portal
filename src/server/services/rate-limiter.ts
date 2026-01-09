import crypto from 'node:crypto';

const WINDOW_MS = 60 * 1000; // 1 minute window
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean up old entries every minute

interface RateLimitRecord {
  timestamps: number[];
}

// Separate stores for different rate limit types
const createLimits = new Map<string, RateLimitRecord>();
const retrieveLimits = new Map<string, RateLimitRecord>();

/**
 * Hash IP prefix for privacy-preserving rate limiting
 * Only uses first 3 octets of IPv4 or first 48 bits of IPv6
 */
function hashIdentifier(ip: string): string {
  // Extract IP prefix (privacy-preserving)
  let prefix: string;
  if (ip.includes(':')) {
    // IPv6 - use first 3 groups
    prefix = ip.split(':').slice(0, 3).join(':');
  } else {
    // IPv4 - use first 3 octets
    prefix = ip.split('.').slice(0, 3).join('.');
  }

  // Hash the prefix
  return crypto.createHash('sha256').update(prefix).digest('hex').slice(0, 16);
}

/**
 * Check if request is within rate limit
 */
function checkLimit(
  store: Map<string, RateLimitRecord>,
  identifier: string,
  maxRequests: number
): boolean {
  const hashedId = hashIdentifier(identifier);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let record = store.get(hashedId);

  if (!record) {
    record = { timestamps: [] };
    store.set(hashedId, record);
  }

  // Remove timestamps outside the window
  record.timestamps = record.timestamps.filter(ts => ts > windowStart);

  // Check if under limit
  if (record.timestamps.length >= maxRequests) {
    return false;
  }

  // Add current timestamp
  record.timestamps.push(now);
  return true;
}

/**
 * Check rate limit for entry creation (10 per minute)
 */
export function checkCreateLimit(ip: string): boolean {
  return checkLimit(createLimits, ip, 10);
}

/**
 * Check rate limit for entry retrieval (5 per minute)
 */
export function checkRetrieveLimit(ip: string): boolean {
  return checkLimit(retrieveLimits, ip, 5);
}

/**
 * Clean up old rate limit entries
 */
function cleanup(): void {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  for (const [key, record] of createLimits.entries()) {
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);
    if (record.timestamps.length === 0) {
      createLimits.delete(key);
    }
  }

  for (const [key, record] of retrieveLimits.entries()) {
    record.timestamps = record.timestamps.filter(ts => ts > windowStart);
    if (record.timestamps.length === 0) {
      retrieveLimits.delete(key);
    }
  }
}

// Start cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

export function startRateLimitCleanup(): void {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanup, CLEANUP_INTERVAL_MS);
  }
}

export function stopRateLimitCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
