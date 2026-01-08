# Data Model: Text-to-Link Bridge

**Feature**: 001-text-portal
**Date**: 2026-01-08

## Entities

### TextEntry

Represents a single text submission with its encrypted content and metadata.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| code | string | 6-digit numeric identifier | Primary key, format: /^[0-9]{6}$/ |
| encryptedContent | Buffer | AES-256-GCM encrypted text | Max ~67KB (50K chars encrypted) |
| iv | Buffer | Initialization vector for decryption | 16 bytes, unique per entry |
| authTag | Buffer | GCM authentication tag | 16 bytes |
| createdAt | number | Unix timestamp (ms) of creation | Immutable |
| expiresAt | number | Unix timestamp (ms) of expiration | createdAt + 600000 (10 min) |

**Lifecycle**:
```
Created → Active → Deleted
                ↑
                └── via retrieval (one-time) OR expiration (TTL)
```

**State Transitions**:

| From | To | Trigger | Action |
|------|-----|---------|--------|
| - | Created | POST /api/entries | Generate code, encrypt content, store |
| Created | Deleted | GET /api/entries/:code (success) | Return decrypted content, delete from store |
| Created | Deleted | TTL expiration | Background cleanup removes entry |

### RateLimitEntry (Internal)

Tracks request timestamps for rate limiting. Not persisted, not exposed via API.

| Field | Type | Description |
|-------|------|-------------|
| identifier | string | Hashed IP prefix (privacy-preserving) |
| timestamps | number[] | Recent request timestamps within window |

**Note**: IP addresses are hashed and only the prefix is used. No full IPs are stored.

## Storage Structure

### In-Memory Store

```typescript
// Primary content store
Map<string, TextEntry>  // key: code (e.g., "482916")

// Rate limiting store (separate, auto-cleaned)
Map<string, RateLimitEntry>  // key: hashed IP prefix
```

### Indexes

No additional indexes needed:
- Primary lookup by code is O(1) via Map
- No queries by content, timestamp, or other fields
- Expiration cleanup iterates all entries (acceptable at low scale)

## Validation Rules

### TextEntry Creation

| Field | Rule | Error |
|-------|------|-------|
| content | Required, non-empty string | "Content is required" |
| content | Max 50,000 characters | "Content exceeds maximum length" |
| content | Valid UTF-8 | "Invalid content encoding" |

### TextEntry Retrieval

| Field | Rule | Error |
|-------|------|-------|
| code | Required, 6 digits | "Invalid code format" |
| code | Exists in store | "Code not found" (generic) |
| code | Not expired | "Code not found" (same as above, no leak) |

## Data Flow

### Create Entry

```
1. Validate content (length, encoding)
2. Generate random 6-digit code
3. Check for collision, regenerate if needed
4. Generate random IV (16 bytes)
5. Encrypt content with AES-256-GCM
6. Store TextEntry in Map
7. Return code + expiration time + QR data URL
```

### Retrieve Entry

```
1. Validate code format
2. Lookup in Map
3. If not found → return generic error
4. If expired → delete from Map, return generic error
5. Decrypt content using stored IV and authTag
6. Delete entry from Map (one-time access)
7. Return decrypted content
```

### Cleanup (Background)

```
Every 60 seconds:
1. Iterate all entries in Map
2. If entry.expiresAt < Date.now():
   - Delete from Map
3. Clean up old rate limit entries (>1 min old)
```

## Encryption Details

### Algorithm

- **Cipher**: AES-256-GCM (authenticated encryption)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes), random per entry
- **Auth Tag Size**: 128 bits (16 bytes)

### Key Management

- Encryption key generated at server startup using `crypto.randomBytes(32)`
- Key held in memory only, never persisted
- Server restart = new key = all existing entries unrecoverable (by design)

### Encryption Flow

```typescript
// Encrypt
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()]);
const authTag = cipher.getAuthTag();

// Decrypt
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag);
const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
```

## Capacity Planning

### Memory Estimates

| Scenario | Entries | Memory |
|----------|---------|--------|
| Typical | 10-20 concurrent | ~1 MB |
| Peak | 100 concurrent | ~5 MB |
| Maximum | 500 concurrent | ~25 MB |

### Code Space

- 1,000,000 possible codes (000000-999999)
- At 100 concurrent entries: 0.01% utilization
- At 500 concurrent entries: 0.05% utilization
- Collision probability negligible; guessing probability ~0.005% with rate limiting

## Privacy Guarantees

1. **No content logging**: Encrypted content never logged, even in errors
2. **No code logging**: Access codes not logged
3. **No IP storage**: Only hashed prefix used for rate limiting, not persisted
4. **No timestamps logged**: Creation/access times not logged
5. **Automatic deletion**: All data deleted within 10 minutes maximum
6. **Memory-only**: No disk persistence, server restart clears all
