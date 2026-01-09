# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Speckit** project - a specification-driven development workflow that uses structured artifacts (specs, plans, tasks) to guide implementation. The project uses Claude Code skills (slash commands) to manage the full development lifecycle from feature specification to implementation.

## Speckit Workflow

The development workflow follows this sequence:

1. **`/speckit.constitution`** - Define project principles and constraints (one-time setup)
2. **`/speckit.specify <feature description>`** - Create feature specification from natural language
3. **`/speckit.clarify`** - Identify and resolve ambiguities in the spec (optional)
4. **`/speckit.plan`** - Generate technical implementation plan with research, data models, and contracts
5. **`/speckit.tasks`** - Break plan into dependency-ordered, executable tasks
6. **`/speckit.analyze`** - Cross-artifact consistency check (optional, read-only)
7. **`/speckit.implement`** - Execute tasks defined in tasks.md
8. **`/speckit.checklist`** - Generate requirements quality checklists (optional)
9. **`/speckit.taskstoissues`** - Convert tasks to GitHub issues (optional)

## Project Structure

```
.specify/
├── memory/
│   └── constitution.md      # Project principles (template - fill before use)
├── templates/
│   ├── spec-template.md     # Feature specification template
│   ├── plan-template.md     # Implementation plan template
│   ├── tasks-template.md    # Task breakdown template
│   └── checklist-template.md
└── scripts/bash/
    ├── create-new-feature.sh    # Creates feature branch and spec structure
    ├── setup-plan.sh            # Initializes plan.md for a feature
    ├── check-prerequisites.sh   # Validates required artifacts exist
    └── update-agent-context.sh  # Updates agent-specific context files

specs/<###-feature-name>/        # Generated per-feature (created by /speckit.specify)
├── spec.md                      # Feature specification
├── plan.md                      # Technical implementation plan
├── research.md                  # Research findings
├── data-model.md                # Entity definitions
├── quickstart.md                # Integration scenarios
├── tasks.md                     # Executable task list
├── contracts/                   # API contracts (OpenAPI/GraphQL)
└── checklists/                  # Requirements quality checklists
```

## Key Conventions

### Branch Naming
Features use `###-short-name` format (e.g., `001-user-auth`). The `/speckit.specify` command auto-generates branch names from feature descriptions.

### Task Format
Tasks in tasks.md follow strict format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- `[P]` marks parallelizable tasks
- `[Story]` maps to user stories (US1, US2, etc.)

### User Stories
Specs organize requirements as prioritized user stories (P1, P2, P3). Each story should be independently implementable and testable.

### Constitution
The constitution at `.specify/memory/constitution.md` defines non-negotiable project principles. Run `/speckit.constitution` to set up before first feature.

## Common Commands

```bash
# Create new feature (run via /speckit.specify)
.specify/scripts/bash/create-new-feature.sh --json "feature description"

# Setup plan for current feature
.specify/scripts/bash/setup-plan.sh --json

# Check prerequisites before tasks/implement
.specify/scripts/bash/check-prerequisites.sh --json
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

## Implementation Notes

- Specs focus on WHAT (requirements), not HOW (implementation)
- Plans include technical context, constitution checks, and project structure decisions
- Tasks are organized by user story phase for incremental delivery
- Checklists validate requirements quality, not implementation correctness
- The `/speckit.analyze` command is read-only and never modifies files

## Active Technologies
- TypeScript 5.x (Node.js 20 LTS) + Hono (lightweight web framework), QRCode library (001-text-portal)
- In-memory with encryption (no database - ephemeral by design) (001-text-portal)

## Recent Changes
- 001-text-portal: Added TypeScript 5.x (Node.js 20 LTS) + Hono (lightweight web framework), QRCode library
