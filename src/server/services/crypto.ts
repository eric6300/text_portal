import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Generate encryption key at startup - held in memory only
const encryptionKey = crypto.randomBytes(32);

export interface EncryptedData {
  encryptedContent: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

/**
 * Encrypt text content using AES-256-GCM
 */
export function encrypt(content: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(content, 'utf8'),
    cipher.final(),
  ]);

  return {
    encryptedContent: encrypted,
    iv,
    authTag: cipher.getAuthTag(),
  };
}

/**
 * Decrypt content using AES-256-GCM
 */
export function decrypt(
  encryptedContent: Buffer,
  iv: Buffer,
  authTag: Buffer
): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encryptedContent),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
