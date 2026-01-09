<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0
Bump rationale: Initial constitution creation (MAJOR)

Modified principles: N/A (first version)

Added sections:
  - Core Principles (3 principles)
  - Security & Privacy Constraints
  - Development Standards
  - Governance

Removed sections: N/A

Templates validation:
  ✅ .specify/templates/plan-template.md - Constitution Check section exists
  ✅ .specify/templates/spec-template.md - Compatible with principles
  ✅ .specify/templates/tasks-template.md - Compatible with principles

Follow-up TODOs: None
-->

# Text Portal Constitution

## Core Principles

### I. Zero-Login Access (NON-NEGOTIABLE)

The system MUST allow content retrieval without requiring any user authentication on the viewing device.

- Computer-side access MUST NOT require login to any account (Google, email, or otherwise)
- Links MUST be directly accessible via standard web browser
- No cookies, sessions, or tracking mechanisms that require user identification
- Rationale: This is the core value proposition - eliminating the security risk of logging into personal accounts on shared/public computers in healthcare settings

### II. One-Click Shareability

The system MUST provide frictionless sharing from mobile to desktop with minimal user interaction.

- Text submission MUST generate a shareable link in a single action
- Links MUST be short, easy to type manually if needed
- QR code generation SHOULD be available as an alternative sharing method
- Mobile interface MUST be optimized for quick text input and link generation
- Rationale: Healthcare workers need speed - every extra tap or step reduces adoption

### III. Auto-Destruct by Default

All stored content MUST have automatic expiration mechanisms to leave no persistent traces.

- One-time links: Content MUST be deleted immediately after first access
- Time-based expiration: Content MUST auto-delete after a configurable short period (default: 5 minutes)
- No content logging or history retention on the server
- MUST NOT store IP addresses, browser fingerprints, or any identifying metadata
- Rationale: Privacy-first design ensures that even if a link is intercepted later, the content is gone

## Security & Privacy Constraints

- All data transmission MUST use HTTPS/TLS encryption
- Server-side storage MUST be encrypted at rest
- Content IDs MUST be cryptographically random and non-sequential
- System MUST NOT require or store any personally identifiable information (PII)
- Rate limiting MUST be implemented to prevent abuse
- No analytics or tracking scripts on the viewing page

## Development Standards

- **Simplicity First**: Prefer the simplest solution that meets requirements. No over-engineering.
- **Privacy by Design**: Every feature MUST be evaluated for privacy implications before implementation
- **Offline Resilience**: Core viewing functionality SHOULD work with minimal JavaScript
- **Accessibility**: Interface MUST be usable on low-spec devices and slow connections
- **No External Dependencies**: Viewing page MUST NOT load external resources (CDNs, fonts, analytics)

## Governance

This constitution defines non-negotiable principles for the Text Portal project.

- All feature specifications MUST demonstrate compliance with Core Principles
- Implementation plans MUST include a Constitution Check section
- Violations require explicit justification and approval before proceeding
- Amendments to this constitution require documentation of rationale and migration plan

**Version**: 1.0.0 | **Ratified**: 2026-01-08 | **Last Amended**: 2026-01-08
