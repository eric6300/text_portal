# Tasks: Text-to-Link Bridge

**Input**: Design documents from `/specs/001-text-portal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks omitted. Add test tasks if TDD is desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project directory structure per plan.md layout
- [x] T002 Initialize Node.js project with package.json (TypeScript 5.x, Node 20 LTS)
- [x] T003 [P] Install dependencies: hono, qrcode, @types/node, typescript, vitest
- [x] T004 [P] Configure tsconfig.json for TypeScript compilation
- [x] T005 [P] Create shared types in src/shared/types.ts (TextEntry, CreateEntryRequest, CreateEntryResponse, etc.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement encryption service in src/server/services/crypto.ts (AES-256-GCM encrypt/decrypt)
- [x] T007 [P] Implement 6-digit code generator in src/server/services/code-generator.ts
- [x] T008 [P] Implement rate limiter in src/server/services/rate-limiter.ts (sliding window, 10 creates/min, 5 retrieves/min)
- [x] T009 Implement entry store in src/server/services/entry-store.ts (in-memory Map with encryption)
- [x] T010 [P] Implement security middleware in src/server/middleware/security.ts (CSP, HSTS, X-Frame-Options)
- [x] T011 Create Hono app skeleton in src/server/index.ts with middleware registration
- [x] T012 [P] Create base HTML template in src/client/styles.css (inline CSS, no external deps)
- [x] T013 Setup background cleanup interval for expired entries in src/server/services/entry-store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Send Text from Mobile (Priority: P1)

**Goal**: Physician can enter text on mobile, tap "Generate Code", and see a 6-digit code + QR code displayed

**Independent Test**: Enter text on /send page, tap generate, verify code displays with countdown timer

### Implementation for User Story 1

- [x] T014 [US1] Implement POST /api/entries endpoint in src/server/routes/api.ts (validate content, generate code, encrypt, store, return response)
- [x] T015 [US1] Implement QR code generation in POST /api/entries response (qrcode library, data URL)
- [x] T016 [US1] Create mobile sender page HTML in src/server/routes/pages.ts (text input, generate button, mobile-optimized)
- [x] T017 [US1] Implement sender page JavaScript: form submission, display code prominently, show QR code
- [x] T018 [US1] Implement countdown timer display showing remaining validity time
- [x] T019 [US1] Implement GET /send page route in src/server/routes/pages.ts

**Checkpoint**: User Story 1 complete - mobile text submission and code generation works independently

---

## Phase 4: User Story 2 - Retrieve Text on Desktop (Priority: P1)

**Goal**: Healthcare worker enters 6-digit code on desktop, sees text content, can copy to clipboard

**Independent Test**: Enter valid code on root page, verify text displays with copy button that works

### Implementation for User Story 2

- [x] T020 [US2] Implement GET /api/entries/:code endpoint in src/server/routes/api.ts (validate code, decrypt, delete, return content)
- [x] T021 [US2] Create desktop receiver page HTML in src/server/routes/pages.ts (code input field, submit button)
- [x] T022 [US2] Implement receiver page JavaScript: form submission, display retrieved text
- [x] T023 [US2] Implement "Copy to Clipboard" button with visual confirmation feedback
- [x] T024 [US2] Handle error states (invalid format, code not found) with user-friendly messages
- [x] T025 [US2] Implement GET / (root) page route in src/server/routes/pages.ts

**Checkpoint**: User Story 2 complete - desktop code entry and text retrieval works independently

---

## Phase 5: User Story 3 - Automatic Content Expiration (Priority: P1)

**Goal**: Content is deleted after first retrieval or after 10-minute TTL, leaving no traces

**Independent Test**: Generate code, retrieve once, try again (should fail). Generate code, wait 10+ min (should fail).

### Implementation for User Story 3

- [x] T026 [US3] Verify one-time access: entry deletion in GET /api/entries/:code after successful retrieval
- [x] T027 [US3] Implement TTL check in GET /api/entries/:code (delete expired, return generic error)
- [x] T028 [US3] Verify background cleanup removes expired entries in entry-store.ts
- [x] T029 [US3] Ensure generic error message for both "not found" and "expired" cases (no information leakage)

**Checkpoint**: User Story 3 complete - security guarantees verified

---

## Phase 6: User Story 4 - Direct Link Access (Priority: P2)

**Goal**: Users can access content via short URL (e.g., /482916) or QR code scan without manual code entry

**Independent Test**: Navigate directly to /[code], verify text displays without code entry step

### Implementation for User Story 4

- [x] T030 [US4] Implement GET /:code route in src/server/routes/pages.ts (6-digit pattern match)
- [x] T031 [US4] Render content directly on page when accessed via direct URL
- [x] T032 [US4] Ensure direct URL path works with QR code (retrievalUrl in response)
- [x] T033 [US4] Handle invalid/expired codes on direct access with appropriate error page

**Checkpoint**: User Story 4 complete - direct link and QR code access works

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T034 [P] Add rate limiting to all API endpoints using rate-limiter.ts
- [x] T035 [P] Verify no PII in any logs (content, codes, IPs not logged)
- [x] T036 Add "Send Another" button on sender page after successful generation
- [x] T037 Add "Enter Another Code" link on receiver page after successful retrieval
- [x] T038 [P] Validate CSS works without external fonts (system font stack only)
- [x] T039 [P] Test page load performance on slow connection (3G simulation)
- [x] T040 Create build script in package.json (TypeScript compilation)
- [x] T041 [P] Create start script in package.json (run compiled server)
- [x] T042 [P] Add environment variable handling (PORT, BASE_URL, NODE_ENV) in src/server/config.ts
- [x] T043 Run quickstart.md validation (manual test of documented workflows)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 priority, can proceed in parallel after Foundational
  - US3 verifies security behavior from US1/US2, should follow them
  - US4 is P2 priority, can be done after US1/US2 or in parallel
- **Polish (Phase 7)**: Depends on core user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - independent
- **User Story 2 (P1)**: Can start after Foundational - independent, uses same API as US1
- **User Story 3 (P1)**: Verifies behavior of US1 and US2 - should follow them
- **User Story 4 (P2)**: Can start after Foundational - builds on US2 retrieval logic

### Within Each Phase

- Models/types before services
- Services before routes
- Routes before pages
- Backend before frontend JavaScript

### Parallel Opportunities

**Setup Phase (all [P] tasks can run in parallel):**
- T003, T004, T005

**Foundational Phase:**
- T007, T008 can run in parallel
- T010, T012 can run in parallel

**After Foundational:**
- User Story 1 and User Story 2 can be developed in parallel by different developers
- User Story 4 can start once basic retrieval works

---

## Parallel Example: Foundational Phase

```bash
# After T006 (crypto) completes, launch these in parallel:
Task: "Implement 6-digit code generator in src/server/services/code-generator.ts"
Task: "Implement rate limiter in src/server/services/rate-limiter.ts"
Task: "Implement security middleware in src/server/middleware/security.ts"
Task: "Create base HTML template in src/client/base.html"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (mobile send)
4. Complete Phase 4: User Story 2 (desktop receive)
5. Complete Phase 5: User Story 3 (security verification)
6. **STOP and VALIDATE**: Full transfer flow works with security guarantees
7. Deploy MVP

### Incremental Enhancement

1. MVP deployed → core transfer flow works
2. Add User Story 4 → direct link access improves UX
3. Add Polish phase → production hardening

### Single Developer Strategy

1. Complete Setup → Foundational → US1 → US2 → US3 (in order)
2. Test full transfer flow
3. Add US4 for enhanced UX
4. Polish for production

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|------------------------|
| Setup | 5 | 3 |
| Foundational | 8 | 5 |
| US1 - Mobile Send | 6 | 0 |
| US2 - Desktop Receive | 6 | 0 |
| US3 - Auto-Expiration | 4 | 0 |
| US4 - Direct Link | 4 | 0 |
| Polish | 10 | 6 |
| **Total** | **43** | **14** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All HTML/CSS must be inline or local - no external resources
- All content encrypted at rest with AES-256-GCM
- 6-digit codes provide 1M combinations for brute-force protection
