# Implementation Plan: Text-to-Link Bridge

**Branch**: `001-text-portal` | **Date**: 2026-01-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-text-portal/spec.md`

## Summary

Build a secure text transfer system enabling healthcare workers to send text from mobile devices to desktop computers using one-time 6-digit numeric codes. The system provides two web interfaces: a mobile sender page (`/send`) for text input and code generation, and a desktop receiver page (`/`) for code entry and text retrieval. All content auto-destructs after first access or 10-minute TTL expiration.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)
**Primary Dependencies**: Hono (lightweight web framework), QRCode library
**Storage**: In-memory with encryption (no database - ephemeral by design)
**Testing**: Vitest for unit/integration tests
**Target Platform**: Web (mobile browsers + desktop browsers)
**Project Type**: Web application (single deployable with static frontend)
**Performance Goals**: <2s code generation, <1s text retrieval, 100 concurrent users
**Constraints**: No external CDN/fonts, no PII storage, HTTPS required
**Scale/Scope**: Low volume (~100 concurrent codes max), single-region deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Zero-Login Access (NON-NEGOTIABLE)

| Requirement | Compliance | Implementation |
|-------------|------------|----------------|
| No login on viewing device | ✅ PASS | FR-017: No authentication required |
| Direct browser access | ✅ PASS | FR-010: Direct URL access supported |
| No cookies/sessions/tracking | ✅ PASS | FR-013: No PII storage |

### II. One-Click Shareability

| Requirement | Compliance | Implementation |
|-------------|------------|----------------|
| Single-action link generation | ✅ PASS | FR-002: Single "Generate Code" button |
| Short, typeable links | ✅ PASS | 6-digit numeric codes (000000-999999) |
| QR code option | ✅ PASS | FR-005: QR code generation |
| Optimized mobile interface | ✅ PASS | Dedicated `/send` page |

### III. Auto-Destruct by Default

| Requirement | Compliance | Implementation |
|-------------|------------|----------------|
| One-time access deletion | ✅ PASS | FR-011: Delete after first retrieval |
| Time-based expiration | ✅ PASS | FR-012: 10-minute TTL |
| No content logging | ✅ PASS | FR-013: No PII/metadata storage |
| No IP/fingerprint storage | ✅ PASS | FR-013: Explicit prohibition |

### Security & Privacy Constraints

| Requirement | Compliance | Implementation |
|-------------|------------|----------------|
| HTTPS/TLS encryption | ✅ PASS | FR-015: Encrypt in transit |
| Encrypted at rest | ✅ PASS | FR-015: Encrypt at rest |
| Random content IDs | ✅ PASS | FR-014: Cryptographically random codes |
| No PII storage | ✅ PASS | FR-013, SC-007 |
| Rate limiting | ✅ PASS | FR-016: Brute-force prevention |
| No analytics/tracking | ✅ PASS | FR-018: No external resources |

### Development Standards

| Requirement | Compliance | Implementation |
|-------------|------------|----------------|
| Simplicity First | ✅ PASS | In-memory storage, single deployable |
| Privacy by Design | ✅ PASS | All privacy requirements addressed |
| Offline Resilience | ✅ PASS | Minimal JS, server-rendered content |
| Accessibility | ✅ PASS | SC-008: Works on 3G connections |
| No External Dependencies | ✅ PASS | FR-018: No CDN/fonts/analytics |

**GATE STATUS: ✅ ALL CHECKS PASS** - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-text-portal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── server/
│   ├── index.ts         # Hono app entry point
│   ├── routes/
│   │   ├── api.ts       # POST /api/entries, GET /api/entries/:code
│   │   └── pages.ts     # GET /, GET /send, GET /:code
│   ├── services/
│   │   ├── entry-store.ts    # In-memory encrypted storage
│   │   ├── code-generator.ts # Random 6-digit code generation
│   │   └── rate-limiter.ts   # Request rate limiting
│   └── middleware/
│       └── security.ts  # HTTPS redirect, security headers
├── client/
│   ├── send.html        # Mobile sender page (static)
│   ├── receive.html     # Desktop receiver page (static)
│   └── styles.css       # Inline-able CSS (no external deps)
└── shared/
    └── types.ts         # Shared TypeScript types

tests/
├── unit/
│   ├── entry-store.test.ts
│   ├── code-generator.test.ts
│   └── rate-limiter.test.ts
├── integration/
│   └── api.test.ts
└── e2e/
    └── transfer-flow.test.ts
```

**Structure Decision**: Single deployable web application. Frontend is static HTML/CSS with minimal vanilla JS (no framework needed given simplicity). Backend is a lightweight Hono server. This structure supports the "Simplicity First" principle while meeting all functional requirements.

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| No database | In-memory Map | Content is ephemeral (10 min max); persistence adds complexity without benefit |
| No frontend framework | Static HTML + vanilla JS | Two simple pages; React/Vue overkill per "Simplicity First" |
| Single deployable | Hono serves static + API | Simplest deployment model; no separate static hosting needed |
