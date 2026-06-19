# Architecture Overview: CrowdFAQ Knowledge Platform

_Last updated: 2026-06-19_

## 1. Executive Summary

CrowdFAQ is a full-stack FAQ and knowledge-platform application. The current codebase has evolved beyond the original FAQ crowdsourcing scope into a broad knowledge management platform with:

- React + Vite frontend
- Express.js backend
- MongoDB primary datastore
- SQLite fallback datastore
- JWT authentication
- Runtime fallback when MongoDB is unavailable
- SQLite → MongoDB sync foundation
- REST API surface with OpenAPI/Swagger documentation
- AI-assisted features through Google Gemini integration
- Advanced backend modules for moderation, duplicate detection, exports/imports, recommendations, translations, learning paths, bounties, GraphQL, notification preferences, and RAG-style chat

The backend is currently ahead of the frontend. Most advanced platform capabilities are represented in backend routes, services, models, and SQLite fallback schema. The frontend covers core user/admin flows and includes components for chat, notifications, profile, analytics, dashboard, categories, contributors, bookmarks, landing, and subscription flows, but several backend-complete capabilities still require UI wiring or replacement of static/mock data.

The next development phase should prioritize stabilization, documentation reconciliation, API contract consistency, and frontend integration of backend-complete features rather than adding more major backend features.

---

## 2. Current Implementation State

### 2.1 Fully Implemented Core Platform Features

The following features are implemented across the primary backend architecture and are represented in the current application flow:

- Authentication: signup, login, JWT issuance, authenticated profile lookup
- FAQ creation, listing, search, deletion authorization, and storage
- User query/question submission and pending/resolved lifecycle
- Answer submission and retrieval for FAQs and user queries
- Voting on questions and answers
- Bookmarks / reading list
- Following questions and tags
- Basic notifications with read/delete operations
- Activity statistics and heatmap statistics
- Admin overview and pending-query review
- MongoDB primary persistence
- SQLite fallback persistence
- SQLite schema migrations
- SQLite → MongoDB sync foundation
- AI-generated quick summaries
- REST API documentation through Swagger/OpenAPI

### 2.2 Backend-Implemented Advanced Features

The current backend contains routes, services, models, and/or SQLite schema for the following advanced capabilities:

- Expert answer verification fields and route support
- Badge and milestone service foundation
- Contributor leaderboard route
- FAQ/query/answer revision models and rollback/revision support
- Relevance decay and needs-update backend fields/services
- Export service for JSON, CSV, Markdown, and PDF-style outputs
- Import service for JSON/CSV/Markdown and document/thread generation workflows
- Personalized FAQ recommendation service
- Learning path models and routes
- User learning journey statistics route
- AI moderation service and moderation records
- Duplicate detection and similarity records
- Search analytics and knowledge gap aggregation
- Chat/RAG-style assistant route and chat log model
- FAQ translations and translation model/table
- GraphQL route
- Bounty system model/routes
- Notification preferences model/routes

### 2.3 Frontend-Implemented / Partially Integrated Features

The frontend includes:

- React + Vite SPA structure
- `AuthContext`, `FAQContext`, and `ThemeContext`
- Landing page and app routing
- Dashboard, Questions, Question Detail, Categories, Contributors, Bookmarks, Profile, Admin, Login, Signup, Subscription pages
- Chat widget component
- Activity graph and community heatmap components
- Notification preferences component
- Profile badge/profile analytics components
- Protected route handling
- API abstraction in `frontend/src/api/faqApi.js`
- Local/fallback state handling for some flows

However, several newer backend features still require final frontend wiring or replacement of static/mock UI data.

### 2.4 Final Remaining Issues

These are the primary remaining issues tracked in `missing-features-roadmap.md`:

1. Documentation/file-name alignment: standardized to `missing-features-roadmap.md`, `architecture.md`, and `prompt-template.md`.
2. API response-contract consistency must be formalized.
3. OpenAPI documentation must be expanded to cover all implemented routes.
4. Frontend must be wired to backend-complete advanced features.
5. AI-dependent services must be mocked in tests and gracefully degraded in runtime.
6. SQLite/MongoDB schema parity should be verified continuously.
7. Frontend testing coverage should be added.
8. Markdown/rich formatting sanitization policy remains incomplete.
9. Nested/threaded answers remain unsupported.
10. Anonymous Q&A audit workflow remains incomplete.
11. Expert/SME recommendation and smart category metrics are not fully implemented as dedicated engines.

---

## 3. System Architecture

### 3.1 Frontend Layer

#### Key Files

- `frontend/src/main.jsx`
  - Bootstraps React.
  - Wraps the app with router and providers.

- `frontend/src/App.jsx`
  - Defines frontend page routing.
  - Mounts major page-level components.

- `frontend/src/api/faqApi.js`
  - Centralized API client.
  - Handles backend requests and JWT headers.
  - Should be the first frontend file updated when new backend endpoints are exposed to UI.

- `frontend/src/context/AuthContext.jsx`
  - Handles login, signup, logout, token persistence, and profile fetch.

- `frontend/src/context/FAQContext.jsx`
  - Handles FAQ/question/answer/vote/bookmark state and backend synchronization.

- `frontend/src/context/ThemeContext.jsx`
  - Handles frontend theme state.

#### Frontend Pages

- `Admin.jsx`
- `Bookmarks.jsx`
- `Categories.jsx`
- `Contributors.jsx`
- `Dashboard.jsx`
- `Landing.jsx`
- `Login.jsx`
- `Profile.jsx`
- `QuestionDetail.jsx`
- `Questions.jsx`
- `Signup.jsx`
- `Subscription.jsx`

#### Frontend Components

Important components include:

- `ActivityGraph.jsx`
- `AskQuestionModal.jsx`
- `ChatWidget.jsx`
- `CommunityHeatmap.jsx`
- `ErrorToast.jsx`
- `Hashtag.jsx`
- `NotificationPreferences.jsx`
- `ProfileDropdown.jsx`
- `ProtectedRoute.jsx`
- `Sidebar.jsx`
- `StatsGrid.jsx`
- `Topbar.jsx`
- `TrendingQuestion.jsx`
- `TrendingQuestions.jsx`
- Profile components under `frontend/src/components/profile/`

### 3.2 Backend Layer

#### Main Entry Point

- `backend/server.js`

Responsibilities:

- Load environment variables.
- Configure Express middleware.
- Configure CORS, Helmet, compression, rate limiting, logging, and JSON body parsing.
- Apply `optionalAuth` globally.
- Register API route modules.
- Expose health endpoints.
- Bootstrap SQLite and MongoDB outside test mode.
- Start sync pipeline outside test mode.
- Export the Express app for tests.

#### Registered Route Modules

- `/api/faqs`
- `/api/queries`
- `/api/search`
- `/api/answers`
- `/api/votes`
- `/api/bookmarks`
- `/api/follows`
- `/api/notifications`
- `/api/admin`
- `/api/docs`
- `/api/stats`
- `/api/auth`
- `/api/contributors`
- `/api/export`
- `/api/recommendations`
- `/api/learning-paths`
- `/api/duplicates`
- `/api/chat`
- `/api/graphql`
- `/api/bounties`
- `/api/summary`

---

## 4. Data Architecture

### 4.1 MongoDB Primary Store

MongoDB is used when `isMongoAvailable()` returns true. Mongoose models exist under `backend/models/`.

Current model set includes:

- `Answer`
- `AnswerRevision`
- `Bookmark`
- `Bounty`
- `ChatLog`
- `DuplicateLink`
- `Event`
- `FAQ`
- `FAQRevision`
- `FAQTranslation`
- `Follow`
- `LearningPath`
- `ModerationRecord`
- `Notification`
- `NotificationPreference`
- `QueryRevision`
- `SearchAnalytic`
- `User`
- `UserQuery`
- `Vote`

### 4.2 SQLite Fallback Store

SQLite fallback is initialized in `backend/db/sqlite.js`. It creates core and advanced tables directly and then runs additive migrations under `backend/db/migrations/`.

Important tables include:

- `users`
- `faqs`
- `user_queries`
- `answers`
- `faq_revisions`
- `query_revisions`
- `answer_revisions`
- `votes`
- `bookmarks`
- `follows`
- `notifications`
- `events`
- `moderation_records`
- `duplicate_links`
- `search_analytics`
- `chat_logs`
- `faq_translations`
- `bounties`
- `notification_preferences`
- `learning_paths`
- `learning_path_items`
- `schema_migrations`

### 4.3 Migration Strategy

Migration files:

- `001_stabilize_schema.sql`
- `002_add_sync_indexes.sql`
- `003_notification_metadata.sql`
- `004_add_remaining_lookup_indexes.sql`
- `005_phases_1_and_2.sql`
- `006_phases_3_and_4.sql`
- `007_phases_5_6_7.sql`

Rules:

- Use additive migrations only.
- Do not edit already-applied migrations in production-like environments.
- Keep MongoDB models and SQLite tables in parity for persisted features.
- Ensure tests initialize isolated SQLite files.

---

## 5. Backend Services

Implemented service files include:

- `aiService.js`
- `badgeService.js`
- `categoryService.js`
- `chatRetrievalService.js`
- `decayService.js`
- `duplicateDetectionService.js`
- `eventService.js`
- `exportService.js`
- `followService.js`
- `importService.js`
- `moderationService.js`
- `notificationService.js`
- `queueService.js`
- `recommendationService.js`
- `revisionService.js`
- `syncService.js`
- `translationService.js`

Potential future dedicated services:

- `diffService.js` if server-side text diffing becomes complex.
- `leaderboardService.js` if contributor ranking needs caching or anti-gaming logic.
- `expertMatchingService.js` for SME/expert recommendation workflows.
- `categoryMetricsService.js` for smart/trending category cards.
- `anonymousAuditService.js` for audited anonymous Q&A.

---

## 6. API Contract Policy

The codebase currently has some response-shape drift. The following policy should be used going forward.

### 6.1 Standard Success JSON

For normal API JSON routes:

```json
{
  "status": "success",
  "storage": "sqlite",
  "data": {},
  "meta": {}
}
```

### 6.2 Standard Error JSON

For errors:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### 6.3 Raw Download Responses

Export/download endpoints may return raw content instead of the standard envelope if they set appropriate headers such as:

- `Content-Type`
- `Content-Disposition`

Examples:

- JSON array download
- CSV text
- Markdown text
- PDF stream

### 6.4 Compatibility Notes

Current code may still return some legacy response shapes:

- Auth token/user may appear at top level or under `meta`.
- Bookmark action may appear as `body.action` or `body.meta.action`.
- Search payload may accept keyword-based request bodies rather than only `{ "query": "..." }`.

These should be normalized over time.

---

## 7. Testing Strategy

Backend tests use:

- Jest
- Supertest
- Isolated SQLite database files
- MongoDB only when available
- Mocking/bypassing external AI calls in deterministic tests

Important tests include:

- Auth integration tests
- Answer authorization/regression tests
- Delete authorization tests
- Notification route regression tests
- Protected route tests
- Query validation tests
- SQLite persistence tests
- Sync service tests
- Vote integration tests
- Phase 3/4 and Phase 5/6/7 tests
- Universal post-merge diagnostic suite

The universal diagnostic suite should remain the post-merge gate and should validate:

- Health endpoint
- SQLite schema and migrations
- Auth and JWT resolution
- Protected route rejection
- FAQ/query/answer flows
- Voting/bookmark/follow flows
- Notification ownership and read state
- Stats/admin read contracts
- Implemented/unimplemented roadmap endpoint stability
- Core service determinism

---

## 8. Known Risks

### 8.1 Documentation Drift

The codebase has evolved quickly. `architecture.md`, `prompt-template.md`, `missing-features-roadmap.md`, OpenAPI, and tests must be updated together.

### 8.2 Dual Storage Complexity

Every persisted feature needs both MongoDB and SQLite support. Sync, schema parity, and fallback behavior must be tested continuously.

### 8.3 AI Dependency

Gemini-backed services must degrade gracefully. Tests must mock AI calls.

### 8.4 Frontend/Backend Alignment

Backend capabilities are ahead of the frontend. Several routes need UI integration.

### 8.5 API Envelope Drift

Response shape inconsistencies must be normalized or explicitly documented.

---

## 9. Stabilization Priorities

1. Standardize file naming: completed (filenames are standardized to `missing-features-roadmap.md`, `architecture.md`, and `prompt-template.md`).
2. Reconcile `architecture.md`, `prompt-template.md`, `missing-features-roadmap.md`, and `openapi.yaml`.
3. Finalize response-contract policy and adjust backend helpers/routes.
4. Make the diagnostic post-merge suite green and canonical.
5. Expand OpenAPI coverage for all implemented routes.
6. Wire frontend to backend-complete features.
7. Add frontend tests for core user/admin flows.
8. Add SQLite/MongoDB schema parity checks.
9. Harden AI fallback and logging behavior.
10. Create a release-readiness checklist.

---

## 10. Development Rule

A feature is complete only when the following are done where applicable:

- Frontend UI or API client integration
- Backend route/service implementation
- MongoDB persistence
- SQLite fallback persistence
- Validation
- Authorization
- Event/audit tracking
- Tests
- OpenAPI documentation
- `architecture.md` update
- `missing-features-roadmap.md` update
