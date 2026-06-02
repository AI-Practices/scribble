<!--
  Sync Impact Report — Constitution v1.1.0

  Version change: (template) → 1.1.0

  Modified principles: N/A (initial fill)
  Added sections:
    - I. TypeScript Strictness
    - II. Architecture & Validation
    - III. HTTP-Only Sync (NON-NEGOTIABLE)
    - IV. In-Memory State
    - V. Deterministic Game Logic
    - VI. Brownfield Discipline
    - Quality Standards
    - Review & Workflow
    - Governance

  Removed sections: N/A

  Templates requiring updates:
    ✅ .specify/templates/plan-template.md — `[Gates determined...]` replaced with 6 principle gates
    ✅ .specify/templates/tasks-template.md — TypeScript/Zod/RoomStore foundation tasks added

  Follow-up TODOs: None
-->
# Scribble Constitution

## Core Principles

### I. TypeScript Strictness

Code MUST be fully typed. `any` is forbidden; use `unknown` for genuinely dynamic
types. Imports follow ES Module standards. Prefer immutable data structures and
pure functions.

*Rationale: Eliminates entire classes of runtime errors at compile time.*

### II. Architecture & Validation

Backend follows `src/api` (routes), `src/services` (business logic),
`src/models` (types) layering. Frontend uses functional React components with
hooks. Zod validates all request payloads and responses. State follows the
RoomStore pattern; Redux and Zustand are NOT permitted.

*Rationale: Consistent layering and validation keep maintenance predictable.*

### III. HTTP-Only Sync (NON-NEGOTIABLE)

All client-server sync MUST use HTTP polling. WebSockets, Socket.io, and any
real-time push protocols are STRICTLY FORBIDDEN. Lobby state refreshes at ~2s
intervals during active play.

*Rationale: Lab constraint to demonstrate polling-based architecture.*

### IV. In-Memory State

All data resides in memory only. No databases (SQL, NoSQL, SQLite) are
permitted. Inactive rooms MUST be cleaned up explicitly. No authentication,
sessions, JWT, or OAuth.

*Rationale: Keeps deployment zero-dependency and lab-focused.*

### V. Deterministic Game Logic

Game rules MUST be deterministic: host assignment, word selection, and scoring
(100 per correct guess, 0 otherwise) follow predictable rules from the starter
word list. Edge cases MUST be handled: empty input trimmed, whitespace-only
rejected with message, case-insensitive guess comparison.

*Rationale: Deterministic rules produce reproducible, testable game behavior.*

### VI. Brownfield Discipline

Inspect the existing codebase before writing new code. NEVER rewrite the starter
from scratch. Work incrementally within established patterns and conventions.
Understand current architecture before proposing changes.

*Rationale: Brownfield enhancement preserves proven behavior and minimizes
risk; rewrites introduce unknown defects.*

## Quality Standards

- WCAG 2.1 AA compliance for all UI components.
- `npm run build` MUST pass in both `backend/` and `frontend/`.
- Backend uses centralized error handlers; frontend handles API exceptions
  gracefully without crashing.
- No unjustified top-level dependencies or unrelated refactors.

## Review & Workflow

- Human approval required before every implementation step.
- Commits MUST be granular and meaningful (one logical change per commit).
- A single PR covers all scenarios, following `.github/pull_request_template.md`.
- AI agent MUST read `/speckit.plan` before making changes.
- Follow existing architecture; no rewrites from scratch.

## Governance

This constitution supersedes all other practices and guidance.

**Amendment process**: Proposed change documented → approved by reviewer →
migration plan prepared → applied and version bumped.

**Compliance**: All PRs and reviews MUST verify alignment with every principle.
Non-compliant additions require documented justification in the Complexity
Tracking section of the implementation plan.

**Versioning**: MAJOR.MINOR.PATCH per semver rules below.

**Version**: 1.1.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-01
