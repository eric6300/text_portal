# Feature Specification: Text-to-Link Bridge

**Feature Branch**: `001-text-portal`
**Created**: 2026-01-08
**Status**: Draft
**Input**: User description: "Text-to-Link Bridge with mobile sender interface, desktop receiver interface, one-time access codes, and auto-destruct security"

## Clarifications

### Session 2026-01-08

- Q: Should the code be numeric only or alphanumeric? → A: Numeric only (0-9), 6 digits - easier to type, shows numeric keypad on mobile
- Q: Why 6 digits instead of 4? → A: 6-digit codes (1,000,000 combinations) prevent random guessing attacks; 4-digit codes have unacceptable collision risk for healthcare data
- Q: Should mobile sender and desktop receiver be separate pages or unified? → A: Separate pages - `/send` for mobile text input, `/` (root) for desktop code entry

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send Text from Mobile (Priority: P1)

A physician uses APEN on their mobile device to transcribe spoken medical records into English text. They need to quickly transfer this text to a nursing station computer without logging into any personal accounts.

**Why this priority**: This is the core use case that delivers the primary value proposition - enabling secure, login-free text transfer from mobile to desktop in healthcare settings.

**Independent Test**: Can be fully tested by entering text on mobile, generating a code, and verifying the code is displayed. Delivers value as it completes the "send" half of the transfer flow.

**Acceptance Scenarios**:

1. **Given** a user has text in the mobile input field, **When** they tap "Generate Code", **Then** the system uploads the text and displays a 6-digit code within 2 seconds
2. **Given** a user has just generated a code, **When** viewing the mobile screen, **Then** the code is displayed prominently with remaining validity time
3. **Given** a user wants to share via QR code, **When** they view the generated code screen, **Then** a scannable QR code linking to the content is also displayed

---

### User Story 2 - Retrieve Text on Desktop (Priority: P1)

A healthcare worker at a nursing station computer enters the 6-digit code to retrieve the text content, then copies it to their clipboard for pasting into the medical records system.

**Why this priority**: This completes the core transfer flow. Without retrieval, the send functionality has no value.

**Independent Test**: Can be fully tested by entering a valid code on the desktop interface and verifying text appears with copy functionality. Delivers value as it completes the "receive" half of the transfer flow.

**Acceptance Scenarios**:

1. **Given** a valid 6-digit code exists, **When** the user enters the code on the receiver page, **Then** the associated text content is displayed immediately
2. **Given** text content is displayed, **When** the user clicks "Copy to Clipboard", **Then** the text is copied and visual confirmation is shown
3. **Given** an invalid code is entered, **When** the user submits, **Then** a clear error message is displayed without revealing whether the code existed or expired

---

### User Story 3 - Automatic Content Expiration (Priority: P1)

The system automatically deletes content after it has been read once or after the time limit expires, ensuring no sensitive data persists.

**Why this priority**: Security is non-negotiable for healthcare data. This story ensures privacy compliance and builds user trust.

**Independent Test**: Can be tested by generating a code, accessing it once, then attempting to access again (should fail). Also tested by waiting for expiration time and verifying content is inaccessible.

**Acceptance Scenarios**:

1. **Given** content has been successfully retrieved once, **When** the same code is entered again, **Then** the system returns "Code not found" (one-time access)
2. **Given** a code was generated 10 minutes ago and never accessed, **When** the code is entered, **Then** the system returns "Code not found" (expired)
3. **Given** content is retrieved, **When** checking server storage, **Then** no trace of the content remains

---

### User Story 4 - Direct Link Access (Priority: P2)

Users can also access content via a short URL (e.g., `apen.io/482916`) instead of manually entering the code, enabling QR code scanning or link sharing.

**Why this priority**: Enhances usability by providing an alternative access method, but the core code-entry flow must work first.

**Independent Test**: Can be tested by navigating directly to a generated URL and verifying the content displays without requiring code entry.

**Acceptance Scenarios**:

1. **Given** a code `482916` was generated, **When** user navigates to `[domain]/482916`, **Then** the text content is displayed directly
2. **Given** a user scans the QR code from mobile, **When** the browser opens, **Then** the content page loads without additional steps

---

### Edge Cases

- What happens when the server is temporarily unavailable during code generation? System displays offline error and prompts retry.
- How does the system handle extremely long text content? Text is truncated at a reasonable limit (50,000 characters) with user notification before upload.
- What happens if the same code is requested simultaneously from two devices? First successful request retrieves and deletes; second sees "Code not found".
- How does the system handle network interruption during text retrieval? Partial retrieval does not count as "accessed" - content remains available until fully delivered.
- What happens when many codes are generated rapidly from same device? Rate limiting prevents abuse while allowing legitimate use (max 10 codes per minute).

## Requirements *(mandatory)*

### Functional Requirements

**Mobile Sender Interface (`/send`):**

- **FR-001**: System MUST provide a text input field for entering or receiving text content
- **FR-002**: System MUST provide a "Generate Code" button that uploads text and returns a 6-digit numeric code (000000-999999)
- **FR-003**: System MUST display the generated code prominently after successful upload
- **FR-004**: System MUST display remaining validity time alongside the code
- **FR-005**: System MUST generate and display a QR code that encodes the retrieval URL

**Desktop Receiver Interface (`/` root page):**

- **FR-006**: System MUST provide a code entry field on the root page
- **FR-007**: System MUST retrieve and display text content when a valid code is submitted
- **FR-008**: System MUST provide a "Copy to Clipboard" button with visual confirmation
- **FR-009**: System MUST display a clear, generic error for invalid or expired codes
- **FR-010**: System MUST support direct URL access (e.g., `/482916`) without requiring code entry

**Security & Expiration:**

- **FR-011**: System MUST delete content immediately after first successful retrieval (one-time access)
- **FR-012**: System MUST automatically delete unretrieved content after 10 minutes (TTL expiration)
- **FR-013**: System MUST NOT store IP addresses, user agents, or any identifying information
- **FR-014**: System MUST use cryptographically random, non-sequential code generation
- **FR-015**: System MUST encrypt all content in transit and at rest
- **FR-016**: System MUST implement rate limiting to prevent brute-force code guessing

**General:**

- **FR-017**: System MUST function without requiring any user login or authentication
- **FR-018**: Desktop receiver page MUST work without external resource dependencies (CDNs, fonts, analytics)
- **FR-019**: System MUST provide clear feedback for all user actions (loading states, success, errors)

### Key Entities

- **TextEntry**: Represents a submitted text content with its associated code, encrypted content, creation timestamp, and expiration timestamp
- **AccessCode**: The 6-digit numeric identifier (000000-999999) used to retrieve content; randomly generated and mapped to exactly one TextEntry

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full mobile-to-desktop text transfer in under 30 seconds
- **SC-002**: Code generation completes within 2 seconds of button tap
- **SC-003**: Text retrieval completes within 1 second of code submission
- **SC-004**: 100% of content is deleted within 1 second of first successful retrieval
- **SC-005**: 100% of unretrieved content is deleted within 1 minute after TTL expiration
- **SC-006**: System handles 100 concurrent code generations without degradation
- **SC-007**: Zero personally identifiable information is stored in system logs or database
- **SC-008**: Desktop receiver page loads and functions on connections as slow as 3G
- **SC-009**: 95% of first-time users successfully complete a transfer without assistance

## Assumptions

- The domain for short URLs will be configured at deployment time (referenced as `[domain]` in this specification)
- 6-digit numeric codes (1,000,000 combinations) provide strong protection against random guessing attacks even with multiple concurrent active codes
- 10-minute TTL balances convenience (time to walk to nursing station) with security
- Text content size limit is 50,000 characters, suitable for medical note use cases
- Mobile interface will be accessed via modern mobile browsers (iOS Safari, Chrome for Android)
- Rate limiting allows max 10 codes per minute per device to prevent abuse while enabling legitimate use
