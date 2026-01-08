/**
 * Shared types for Text Portal
 */

/** Stored text entry with encrypted content */
export interface TextEntry {
  code: string;
  encryptedContent: Buffer;
  iv: Buffer;
  authTag: Buffer;
  createdAt: number;
  expiresAt: number;
}

/** Request body for creating a new entry */
export interface CreateEntryRequest {
  content: string;
}

/** Response after successfully creating an entry */
export interface CreateEntryResponse {
  code: string;
  expiresAt: number;
  expiresIn: number;
  qrDataUrl: string;
  retrievalUrl: string;
}

/** Response after successfully retrieving an entry */
export interface GetEntryResponse {
  content: string;
}

/** Error response format */
export interface ErrorResponse {
  error: string;
}

/** Rate limit entry for tracking requests */
export interface RateLimitEntry {
  timestamps: number[];
}

/** Configuration for the application */
export interface AppConfig {
  port: number;
  baseUrl: string;
  nodeEnv: 'development' | 'production';
  ttlMs: number;
  maxContentLength: number;
  rateLimit: {
    createPerMinute: number;
    retrievePerMinute: number;
  };
}
