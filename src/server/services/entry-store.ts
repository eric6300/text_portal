import type { TextEntry } from '../../shared/types.js';
import { encrypt, decrypt } from './crypto.js';
import { generateUniqueCode } from './code-generator.js';

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean up every minute

// In-memory store for entries
const entries = new Map<string, TextEntry>();

/**
 * Create a new text entry with encryption
 * Returns the generated code
 */
export function createEntry(content: string): { code: string; expiresAt: number } {
  const existingCodes = new Set(entries.keys());
  const code = generateUniqueCode(existingCodes);

  const { encryptedContent, iv, authTag } = encrypt(content);
  const now = Date.now();
  const expiresAt = now + TTL_MS;

  const entry: TextEntry = {
    code,
    encryptedContent,
    iv,
    authTag,
    createdAt: now,
    expiresAt,
  };

  entries.set(code, entry);

  return { code, expiresAt };
}

/**
 * Retrieve and delete an entry (one-time access)
 * Returns null if not found or expired
 */
export function retrieveAndDeleteEntry(code: string): string | null {
  const entry = entries.get(code);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    entries.delete(code);
    return null;
  }

  // Decrypt content
  const content = decrypt(entry.encryptedContent, entry.iv, entry.authTag);

  // Delete entry (one-time access)
  entries.delete(code);

  return content;
}

/**
 * Check if an entry exists and is not expired
 * Does NOT delete the entry (use for checking only)
 */
export function hasValidEntry(code: string): boolean {
  const entry = entries.get(code);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    entries.delete(code);
    return false;
  }

  return true;
}

/**
 * Get count of active entries (for monitoring)
 */
export function getActiveEntryCount(): number {
  return entries.size;
}

/**
 * Clean up expired entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [code, entry] of entries.entries()) {
    if (now > entry.expiresAt) {
      entries.delete(code);
    }
  }
}

// Background cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

export function startEntryCleanup(): void {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
  }
}

export function stopEntryCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Clear all entries (for testing)
 */
export function clearAllEntries(): void {
  entries.clear();
}
