import crypto from 'node:crypto';

const CODE_MIN = 0;
const CODE_MAX = 999999;
const MAX_COLLISION_RETRIES = 10;

/**
 * Generate a cryptographically random 6-digit code
 * Returns zero-padded string (e.g., "004829")
 */
export function generateCode(): string {
  const num = crypto.randomInt(CODE_MIN, CODE_MAX + 1);
  return num.toString().padStart(6, '0');
}

/**
 * Generate a unique code that doesn't exist in the provided set
 * Throws error if too many collisions (indicates high load)
 */
export function generateUniqueCode(existingCodes: Set<string>): string {
  for (let i = 0; i < MAX_COLLISION_RETRIES; i++) {
    const code = generateCode();
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  throw new Error('Unable to generate unique code - too many active entries');
}

/**
 * Validate that a string is a valid 6-digit code format
 */
export function isValidCodeFormat(code: string): boolean {
  return /^[0-9]{6}$/.test(code);
}
