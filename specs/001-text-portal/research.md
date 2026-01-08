# Research: Text-to-Link Bridge

**Feature**: 001-text-portal
**Date**: 2026-01-08

## Technology Decisions

### 1. Web Framework: Hono

**Decision**: Use Hono as the web framework

**Rationale**:
- Lightweight (~14KB) - fast startup, minimal overhead
- TypeScript-first with excellent type inference
- Works on Node.js, Deno, Bun, and edge runtimes (future flexibility)
- Simple API similar to Express but more modern
- Built-in middleware for common needs (CORS, compression)
- No external dependencies required for core functionality

**Alternatives Considered**:
- Express.js: Heavier, older patterns, less TypeScript-friendly
- Fastify: Good but more complex setup, overkill for this use case
- Koa: Less active maintenance, smaller ecosystem
- Raw Node.js http: Too low-level, would reinvent routing

### 2. Storage: In-Memory Map with Encryption

**Decision**: Use JavaScript Map with AES-256-GCM encryption, no database

**Rationale**:
- Content is ephemeral (10 min TTL max) - persistence unnecessary
- Eliminates database setup, connection management, migrations
- Map provides O(1) lookup by code
- Server restart clears all data (acceptable given short TTL)
- Simpler deployment (no database container/service)
- Aligns with "Simplicity First" constitution principle

**Alternatives Considered**:
- Redis: Good for ephemeral data, but adds infrastructure dependency
- SQLite: Persistent storage unnecessary, adds complexity
- PostgreSQL: Overkill for ephemeral key-value with 10-min TTL

**Encryption Approach**:
- Use Node.js built-in `crypto` module (no external deps)
- AES-256-GCM for authenticated encryption
- Generate random encryption key at server startup
- Store encrypted content with unique IV per entry

### 3. Code Generation: Crypto-Random 6-Digit

**Decision**: Use `crypto.randomInt()` for 6-digit code generation (000000-999999)

**Rationale**:
- Cryptographically secure random number generation
- 1,000,000 possible codes provides strong protection:
  - With rate limiting (5 attempts/min), max ~50 guesses in 10 min
  - Probability of guessing valid code: ~0.005% (50/1,000,000)
  - Even with multiple active codes, risk remains negligible
- Numeric-only enables mobile numeric keypad
- Zero-padded display (004829 not 4829) for consistent UX
- 6 digits still easy to verbally communicate and manually type

**Collision Handling**:
- Check if generated code exists in store
- Regenerate if collision (rare given low concurrent codes)
- Return error if 10 consecutive collisions (indicates high load)

### 4. QR Code Generation: qrcode Library

**Decision**: Use `qrcode` npm package for server-side QR generation

**Rationale**:
- Generate QR as data URL (no external image hosting)
- Can be inlined in HTML response
- Works without JavaScript on client
- Small package, well-maintained

**Implementation**:
- Generate QR code containing full retrieval URL
- Return as base64 data URL in API response
- Display inline in mobile sender page

### 5. Rate Limiting: Sliding Window Counter

**Decision**: Implement sliding window rate limiting in-memory

**Rationale**:
- Simple algorithm, easy to understand and debug
- No external dependencies (no Redis)
- Sufficient for expected load (~100 concurrent users)
- Limits: 10 codes/min per IP for creation, 5 attempts/min per IP for retrieval

**Implementation**:
- Track timestamps of recent requests per IP
- Slide window on each request, count within window
- Return 429 Too Many Requests when exceeded
- Note: IP used only for rate limiting, not logged

### 6. Frontend: Static HTML with Vanilla JS

**Decision**: No frontend framework, static HTML with minimal vanilla JavaScript

**Rationale**:
- Two simple pages with minimal interactivity
- Constitution requires "No External Dependencies" on viewing page
- Faster initial load, works on slow 3G connections
- Smaller bundle size (constitution: "Accessibility" for low-spec devices)
- Easier to audit for privacy compliance

**Implementation**:
- Server-rendered HTML templates
- Inline CSS (no external stylesheet requests)
- Minimal JS for: clipboard API, form submission, countdown timer
- Progressive enhancement: core functionality works without JS

### 7. Testing: Vitest

**Decision**: Use Vitest for unit and integration testing

**Rationale**:
- Native TypeScript support, no separate config
- Fast execution with watch mode
- Compatible with Hono's test utilities
- Familiar Jest-like API

**Test Strategy**:
- Unit tests for services (entry-store, code-generator, rate-limiter)
- Integration tests for API endpoints
- E2E test for full transfer flow

## Security Considerations

### Encryption at Rest

- AES-256-GCM with random IV per entry
- Encryption key: generated at server startup, held in memory only
- Key rotation: natural on server restart (all data ephemeral anyway)

### Brute Force Protection

- 6-digit code = 1,000,000 possibilities
- Rate limit: 5 retrieval attempts per minute per IP
- With 10-min TTL: max ~50 attempts before code expires
- Probability of guessing valid code: ~0.005% (50/1,000,000) worst case
- Even with 100 concurrent active codes: ~0.5% chance over 10 minutes (acceptable)

### No PII Leakage

- No logging of content, codes, or full IPs
- Rate limiter uses hashed IP prefix (not stored)
- No cookies, localStorage, or session tracking
- Security headers: CSP, X-Content-Type-Options, X-Frame-Options

## Performance Considerations

### Response Time Targets

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Code generation | <2s | In-memory write, sync encryption |
| Text retrieval | <1s | In-memory read, sync decryption |
| QR generation | <500ms | Server-side, cached in response |

### Concurrency

- Node.js single-thread handles 100+ concurrent connections easily
- In-memory Map operations are synchronous (no async bottleneck)
- No database connection pool to manage

### Memory Usage

- ~50KB per entry (assuming 50K char max content)
- 100 concurrent entries = ~5MB
- Well within typical server memory limits

## Deployment Considerations

### Recommended: Container (Docker)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server/index.js"]
```

### Environment Variables

- `PORT`: Server port (default: 3000)
- `BASE_URL`: Public URL for QR code generation
- `NODE_ENV`: production/development

### HTTPS

- Assume deployed behind reverse proxy (nginx, Cloudflare) that handles TLS
- Application sends `Strict-Transport-Security` header
- Redirect HTTP to HTTPS in production
