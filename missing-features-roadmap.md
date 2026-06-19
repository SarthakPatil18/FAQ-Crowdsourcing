# Missing Features Roadmap — CrowdFAQ Final Issues Tracker

_Last updated: 2026-06-19_

## Purpose

This document is the source of truth for final remaining issues in the CrowdFAQ codebase.

The original purpose of this file was to compare the codebase against the feasibility feature list and track missing features. The current codebase has since implemented or scaffolded most backend roadmap capabilities. Therefore, this document now tracks:

1. Features that are still genuinely missing.
2. Features that are backend-complete but frontend-incomplete.
3. Contract/documentation/testing issues that must be resolved before release.
4. Stabilization tasks needed to make the project production-ready.

Use this file before any roadmap-related implementation. After resolving an item, update its status, evidence, remaining gaps, and affected files.

---

## Status Definitions

### Fully Complete

All relevant layers are done:

- Frontend UI/API client
- Backend route/service
- MongoDB model or fields, if persisted
- SQLite table/migration, if persisted
- Validation
- Authorization
- Tests
- OpenAPI docs
- Architecture docs

### Backend Complete / Frontend Pending

Backend routes, services, database schema, and tests exist, but the frontend either:

- does not expose the feature,
- still uses static/mock data,
- lacks controls/buttons/pages,
- or does not show backend state.

### Stabilization Required

Feature exists, but one or more of the following must be fixed:

- response contract drift,
- OpenAPI drift,
- test gaps,
- documentation drift,
- AI fallback issues,
- schema parity concerns,
- edge-case validation.

### Missing / Deferred

Feature is not meaningfully implemented or intentionally deferred.

---

## Current Platform State

### Fully Implemented Core

- Authentication and JWT profile lookup
- FAQ CRUD/search
- User query/question lifecycle
- Answer submission/retrieval
- Voting
- Bookmarks
- Follows
- Basic notifications
- Admin overview and pending-query review
- Activity and heatmap stats
- MongoDB primary persistence
- SQLite fallback persistence
- SQLite migrations
- Sync foundation
- AI summary endpoint
- REST API and Swagger docs baseline

### Backend-Implemented Advanced Features

- Answer verification support
- Badge/milestone backend service
- Contributor leaderboard route
- Revision history and rollback backend support
- Relevance decay and needs-update backend support
- Export service: JSON, CSV, Markdown, PDF-style outputs
- Import service and document/thread generation paths
- Personalized FAQ recommendations
- Learning paths
- Learning journey stats
- AI moderation
- Duplicate detection and similarity scoring
- Search analytics and knowledge gap aggregation
- Chat/RAG route and chat log storage
- FAQ translations
- GraphQL route
- Bounty system
- Notification preferences

---

## Final Remaining Issues

## Issue 1 — Documentation File Naming Drift

Status: Fully Complete
Priority: Critical
Area: Documentation / LLM workflow

### Problem

The repository contained or referenced both `missing-features-roadmap.md` and `missing_features_roadmap.md` along with suffix variations like `.updated.md`. This could confuse development and roadmap retrieval.

### Required Fix

Choose one canonical filename.
Recommended canonical name:
- `missing-features-roadmap.md`
- `architecture.md`
- `prompt-template.md`

Update all references across documentation files.

### Acceptance Criteria

- Only one roadmap filename is used in documentation.
- Prompt template points to the canonical file.
- Future LLM workflow instructions do not reference the old filename.

### Resolution Evidence
- Renamed `architecture.updated.md` to `architecture.md`.
- Renamed `prompt-template.updated.md` to `prompt-template.md`.
- Cleaned up all references to the old filenames across all files.

---

## Issue 2 — API Response Contract Drift

Status: Fully Complete
Priority: Critical
Area: Backend / Frontend / Tests

### Problem

Some routes returned different response shapes:
- Standard JSON envelope: `{ status, storage, data, meta }`
- Auth legacy shape: `{ status, storage, data, token, user }`
- Bookmark action at top-level: `{ action: "created" }`
- Raw export payloads for downloads
- Some validation errors without standardized `{ status, code, message }`

### Required Fix

Create and enforce a formal API response policy:
1. Normal JSON routes return standard envelopes.
2. Errors return standard error envelopes.
3. Download/export routes are explicitly allowed to return raw responses.
4. Auth responses should be normalized to one canonical shape.
5. Frontend API client should handle current compatibility during migration.

### Acceptance Criteria

- Universal diagnostic post-merge test passes.
- OpenAPI describes raw download exceptions.
- Frontend API client does not need ad-hoc parsing per route.

### Resolution Evidence
- Nesting the `meta` object inside `backend/utils/apiResponse.js` standardizes all REST success responses.
- Handled backwards compatibility for the new nested format in the frontend `AuthContext.jsx` and `QuestionDetail.jsx`.
- Standardized the rate limiters, search, and summary responses to return standard envelopes.
- Kept download/export route raw response format behavior while documenting it.
- Confirmed that the diagnostic post-merge tests pass successfully.

---

## Issue 3 — OpenAPI Coverage Drift

Status: Stabilization Required
Priority: Critical
Area: Documentation / API Contracts

### Problem

`backend/openapi.yaml` includes core and some newer endpoints, but the current route surface is broader than the documented API.

### Required Fix

Expand OpenAPI coverage for implemented endpoints, including:

- answer verification
- revisions and rollback
- stale/review routes
- notification preferences
- moderation queue/action/explanation
- knowledge gaps
- duplicate detection
- chat
- translations
- GraphQL
- bounties
- contributor leaderboard
- export/import/thread generation
- recommendations
- learning paths
- journey stats

### Acceptance Criteria

- Every public route mounted in `backend/server.js` is listed in OpenAPI or explicitly marked internal.
- Request/response examples exist for key routes.
- Download routes document raw response formats.

---

## Issue 4 — Frontend Wiring for Backend-Complete Features

Status: Backend Complete / Frontend Pending
Priority: High
Area: Frontend

### Problem

Backend has advanced features that are not fully surfaced in the frontend.

### Required Frontend Work

Add or complete UI/API wiring for:

1. Verified answer badges and moderator verification controls.
2. Real badge/milestone profile rendering.
3. Contributor leaderboard from `/api/contributors/leaderboard`.
4. Revision history and rollback panels.
5. Diff viewer for revisions.
6. Needs-update admin queue and “Still relevant?” feedback.
7. Export controls for JSON/CSV/Markdown/PDF.
8. Import and document-thread generation UI.
9. Learning paths page and path details.
10. Recommendation widgets backed by `/api/recommendations/faqs`.
11. Journey dashboard visualization.
12. Translation controls on FAQ detail.
13. Bounty creation/list/award UI.
14. Notification preferences persistence.

### Acceptance Criteria

- Backend-complete features are accessible from the UI.
- Static/mock data is replaced with API data where backend routes exist.
- Error states and loading states are visible.
- Feature behavior is covered by frontend tests or integration tests.

---

## Issue 5 — AI Service Runtime Hardening

Status: Stabilization Required
Priority: High
Area: AI / Tests / Reliability

### Problem

AI-backed services can call Gemini for moderation, translation, duplicate detection, document parsing, summary generation, and chat. Tests must not depend on real Gemini calls. Runtime must degrade gracefully when API keys are missing or invalid.

### Required Fix

- Mock `@google/genai` or service modules in tests.
- Add explicit timeout and fallback behavior for every AI path.
- Avoid noisy logs in deterministic tests.
- Store AI provenance, confidence, and fallback indicators.
- Ensure CRUD flows do not fail solely because AI is unavailable.

### Acceptance Criteria

- Test suite passes without a valid `GEMINI_API_KEY`.
- Invalid API key does not break content creation.
- AI fallback behavior is documented.

---

## Issue 6 — SQLite/MongoDB Parity Verification

Status: Stabilization Required
Priority: High
Area: Database / Sync

### Problem

The dual-store architecture is powerful but increases risk of schema and behavior drift.

### Required Fix

Add automated checks for:

- MongoDB model fields vs SQLite table columns.
- Required indexes.
- Syncable tables/collections.
- Fallback read/write behavior.
- Migration idempotency.
- Unsynced record monitoring.

### Acceptance Criteria

- A schema parity test exists.
- Universal post-merge test verifies key fallback paths.
- Sync service tests cover idempotency and duplicate avoidance.

---

## Issue 7 — Frontend Test Coverage Gap

Status: Stabilization Required
Priority: Medium
Area: Frontend / QA

### Problem

Backend tests are strong, but frontend test coverage is limited or absent.

### Required Fix

Add React Testing Library/Vitest or equivalent tests for:

- Auth flow
- Protected routes
- Ask question modal
- Question detail answer/vote/bookmark/follow actions
- Admin moderation/knowledge-gap UI
- Notification preferences
- Chat widget
- Dashboard stats components
- Error/loading states

### Acceptance Criteria

- Core frontend flows have automated tests.
- API calls are mocked consistently.
- Tests run in CI.

---

## Issue 8 — Markdown / Rich Formatting Sanitization

Status: Missing / Deferred
Priority: Medium
Area: Security / Content Rendering

### Problem

Text fields exist, but there is no explicit markdown rendering and sanitization policy.

### Required Fix

- Decide whether Markdown is supported.
- Add server-side validation/sanitization rules.
- Add frontend safe renderer.
- Prevent unsafe HTML/script injection.

### Acceptance Criteria

- Markdown policy documented.
- Unsafe content is rejected or sanitized.
- Rendering is tested.

---

## Issue 9 — Nested Threaded Answers

Status: Missing / Deferred
Priority: Medium
Area: Data Model / UI

### Problem

Answers attach to a FAQ or query, but nested parent-child replies are not supported.

### Required Fix

- Add optional `parentAnswerId` to MongoDB and SQLite.
- Add retrieval ordering for nested threads.
- Update answer submission UI.
- Add tests.

### Acceptance Criteria

- Users can reply to an answer.
- Nested answers render correctly.
- Deletion/authorization rules apply to nested replies.

---

## Issue 10 — Anonymous Q&A Audit Workflow

Status: Missing / Deferred
Priority: Medium
Area: Auth / Audit / Safety

### Problem

Anonymous fallback exists, but there is no complete audited anonymous-mode workflow.

### Required Fix

- Define anonymous submission policy.
- Add audit metadata that does not expose identity publicly.
- Add moderation guardrails.
- Add admin review visibility.

### Acceptance Criteria

- Anonymous users can submit only allowed content.
- Admins have sufficient audit context.
- Abuse controls are documented.

---

## Issue 11 — Expert/SME Matching Engine

Status: Missing / Deferred
Priority: Low
Area: Recommendations / Notifications

### Problem

Notifications and follows exist, but there is no dedicated expert matching system.

### Required Fix

- Add expert topic profile fields or model.
- Rank experts by category, tags, verified answers, and reputation.
- Notify matched experts for unanswered questions.
- Add throttling and preferences.

### Acceptance Criteria

- Questions can trigger expert recommendations.
- Notifications respect preferences.
- Ranking is explainable.

---

## Issue 12 — Smart Category Metrics

Status: Missing / Deferred
Priority: Low
Area: Analytics / Categories

### Problem

Categories exist, but smart category cards do not have a dedicated backend metrics service.

### Required Fix

- Aggregate category activity, trending tags, unanswered counts, stale content, and engagement.
- Add route such as `GET /api/categories/metrics`.
- Wire frontend category cards to real metrics.

### Acceptance Criteria

- Category cards display backend-derived metrics.
- Metrics are tested and documented.

---

## Recommended Final Stabilization Order

1. Standardize roadmap filename and documentation references.
2. Make diagnostic post-merge test green and canonical.
3. Normalize/define API response contracts.
4. Expand OpenAPI coverage.
5. Harden AI mocking/fallback behavior.
6. Add SQLite/MongoDB parity checks.
7. Wire frontend to backend-complete features.
8. Add frontend tests.
9. Implement markdown sanitization policy.
10. Decide whether to defer or implement nested answers, anonymous audit workflow, SME matching, and smart category metrics.

---

## Definition of Done

A roadmap item is done only when:

- Code is implemented.
- MongoDB and SQLite parity exists where applicable.
- Tests are added or updated.
- Frontend is wired where user-facing.
- OpenAPI is updated where public.
- `architecture.md` is updated.
- This roadmap is updated.
- Universal post-merge test passes.
