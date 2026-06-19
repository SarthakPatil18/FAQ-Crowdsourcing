# Prompt Template for CrowdFAQ Knowledge Platform

_Last updated: 2026-06-19_

## Project Summary

CrowdFAQ is a full-stack FAQ and knowledge-platform repository with:

- React + Vite frontend
- Express.js backend
- MongoDB primary persistence
- SQLite fallback persistence
- JWT authentication
- SQLite → MongoDB sync foundation
- REST API and OpenAPI/Swagger documentation
- Google Gemini-backed AI features with required test-time mocking
- Advanced backend capabilities for moderation, duplicate detection, exports/imports, recommendations, translations, learning paths, bounties, GraphQL, notification preferences, and RAG-style chat

Use this file when prompting an LLM to inspect, explain, stabilize, modify, or extend the project.

---

## Canonical Documentation Files

Use these files as the current documentation set:

1. `architecture.md`
2. `missing-features-roadmap.md`
3. `prompt-template.md`
4. `backend/openapi.yaml`
5. `backend/tests/universal.postmerge.diagnostic.test.js`

Filenames have been standardized to prevent documentation naming drift.

---

## Mandatory Workflow for LLMs

Before roadmap-related implementation or stabilization:

1. Read `missing-features-roadmap.md`.
2. Read `architecture.md`.
3. Read this `prompt-template.md`.
4. Inspect the exact backend/frontend files involved.
5. Inspect `backend/openapi.yaml` if public routes are involved.
6. Inspect or update `backend/tests/universal.postmerge.diagnostic.test.js` if backend behavior changes.

Do not guess the current implementation state. If required documentation is missing, ask for it.

---

## Current Codebase Reality

The backend is broad and ahead of the frontend. Many advanced features are represented in backend routes, models, SQLite schema, services, and tests. Several of those features still need frontend wiring, contract cleanup, OpenAPI expansion, or stabilization.

Therefore, do not assume that a feature listed in an older roadmap as “missing” is still missing. Verify from:

- `backend/server.js`
- `backend/routes/`
- `backend/services/`
- `backend/models/`
- `backend/db/sqlite.js`
- `backend/db/migrations/`
- `frontend/src/api/faqApi.js`
- relevant frontend pages/components
- tests

---

## Implementation Rule

When asked to implement or fix something:

1. Identify the exact roadmap item or stabilization issue.
2. Confirm its current state:
   - Fully complete
   - Backend complete / frontend pending
   - Stabilization required
   - Missing/deferred
3. Implement only the scoped item.
4. Preserve MongoDB/SQLite parity.
5. Preserve existing core behavior.
6. Add or update tests.
7. Update documentation.
8. Update OpenAPI if public routes changed.
9. Run or maintain the universal post-merge diagnostic test.

Do not implement unrelated roadmap items opportunistically.

---

## Documentation Update Rule

After any feature or stabilization change, update:

- `missing-features-roadmap.md`
- `architecture.md`
- `backend/openapi.yaml`, if API routes changed
- `backend/tests/universal.postmerge.diagnostic.test.js`, if behavior changed
- `prompt-template.md`, only if workflow guidance or architecture conventions changed

---

## Response Contract Rule

Use this policy when editing backend routes.

### Normal JSON Success

```json
{
  "status": "success",
  "storage": "sqlite",
  "data": {},
  "meta": {}
}
```

### Standard JSON Error

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### Download/Export Exceptions

Export routes may return raw content if they set suitable headers:

- `Content-Type`
- `Content-Disposition`

Document these exceptions in OpenAPI and tests.

---

## Storage Parity Rule

For persisted features:

1. Add/update MongoDB model fields.
2. Add/update SQLite schema through additive migration.
3. Implement MongoDB and SQLite read/write paths.
4. Consider sync behavior.
5. Add tests runnable without MongoDB.

Never add a MongoDB-only persisted feature unless explicitly marked as intentionally deferred.

---

## AI Reliability Rule

For any Gemini/AI-backed feature:

1. Tests must not call the real external API.
2. Mock `@google/genai` or the service wrapper.
3. Runtime must handle missing/invalid API keys gracefully.
4. CRUD should not fail solely due to AI outage.
5. Store provenance, confidence, and fallback indicators where relevant.

---

## Frontend Integration Rule

When backend routes already exist, prefer wiring the frontend before adding new backend features.

Common frontend integration targets:

- Verified answer badges
- Contributor leaderboard
- Badge/milestone profile data
- Revision history and rollback UI
- Export/import controls
- Learning paths
- Recommendations
- Journey dashboard
- Translation controls
- Bounties
- Notification preferences
- Needs-update queue

---

## Key Backend Files

- `backend/server.js`
- `backend/db/mongo.js`
- `backend/db/sqlite.js`
- `backend/db/migrations/`
- `backend/middleware/auth.js`
- `backend/middleware/validate.js`
- `backend/middleware/ownership.js`
- `backend/middleware/rateLimits.js`
- `backend/routes/`
- `backend/services/`
- `backend/models/`
- `backend/utils/apiResponse.js`
- `backend/utils/pagination.js`

---

## Key Frontend Files

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/api/faqApi.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/context/FAQContext.jsx`
- `frontend/src/context/ThemeContext.jsx`
- `frontend/src/pages/`
- `frontend/src/components/`

---

## Testing Rule

Backend tests use Jest and Supertest with isolated SQLite databases.

When changing backend behavior, add/update tests for:

- success path
- validation failure
- authorization failure
- ownership failure where applicable
- SQLite fallback behavior
- MongoDB path if practical
- AI fallback behavior where applicable
- OpenAPI/contract behavior where applicable

The diagnostic post-merge suite should stay green and should avoid real AI/API calls.

---

## Recommended Prompt Patterns

### Stabilize API contracts

```text
Read missing-features-roadmap.md and architecture.md. Stabilize API response contracts for auth, bookmarks, search, and export routes. Preserve backward compatibility in frontend/src/api/faqApi.js, update backend/openapi.yaml, and update universal.postmerge.diagnostic.test.js.
```

### Wire frontend to backend-complete feature

```text
Read missing-features-roadmap.md and architecture.md. Wire the frontend Contributors page to GET /api/contributors/leaderboard. Replace static/mock ranking data, add loading/error states, update faqApi.js, and update documentation.
```

### Update OpenAPI

```text
Inspect backend/server.js and backend/routes. Expand backend/openapi.yaml so every public route is documented, including moderation, duplicate detection, chat, translations, bounties, notification preferences, revisions, export/import, recommendations, and learning paths.
```

### Harden AI testing

```text
Inspect all services that import @google/genai. Ensure tests mock external AI calls, runtime handles invalid API keys gracefully, and universal.postmerge.diagnostic.test.js remains deterministic.
```

### Reconcile documentation

```text
Compare architecture.md, missing-features-roadmap.md, prompt-template.md, backend/openapi.yaml, and backend/server.js. Update the docs so feature statuses and route lists match the current codebase exactly.
```

---

## Safe Editing Rules

1. Do not remove SQLite fallback support.
2. Do not add persisted MongoDB features without SQLite equivalents.
3. Do not expose moderator/admin actions without `requireAuth` and `requireRole`.
4. Do not rely on external AI calls in tests.
5. Keep tests runnable without MongoDB.
6. Prefer additive migrations.
7. Keep routes thin and move reusable business logic to services.
8. Maintain or document response-envelope exceptions.
9. Update OpenAPI for public route changes.
10. Update roadmap and architecture after changes.
11. Do not mark a feature complete unless all relevant layers are complete.

---

## Final Instruction

The next major phase is stabilization and frontend alignment, not backend feature expansion. Use `missing-features-roadmap.md` to resolve the final remaining issues one by one, and keep the documentation, tests, and API contracts synchronized after every change.
