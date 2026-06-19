# Prompt Template for CrowdFAQ Frontend Implementation Sprint

_Last updated: 2026-06-19_

## Purpose

This prompt template governs the next CrowdFAQ frontend sprint.

The codebase already has a broad backend with many completed or partially completed capabilities. However, this sprint includes two categories of frontend work:

1. **Frontend integrations for backend-complete features**
   - These may call existing backend APIs.
   - They may update `frontend/src/api/faqApi.js`.
   - They may require OpenAPI/documentation updates if the API contract is clarified.

2. **Upcoming frontend-only features**
   - These must be implemented as UI-only prototypes unless the user explicitly authorizes backend/database work.
   - No backend routes, database tables, migrations, models, or persistence changes should be added for these items yet.
   - Use local component state, mock data, static data, or existing frontend context only.

The primary design and styling guide for all frontend implementation is:

```text
frontend-sample.txt
```

Before implementing any frontend UI, retrieve and inspect `frontend-sample.txt`. If `frontend-sample.txt` is unavailable, pause and ask the user to provide it. Do not invent a visual style from scratch when this file is required.

---

## Mandatory Pause Rule

Before implementing any specific feature from this roadmap, the LLM must pause and await direct user input selecting the exact feature or task to implement.

Do **not** automatically implement the next item in the roadmap.
Do **not** implement multiple features unless the user explicitly asks for multiple features.
Do **not** convert frontend-only features into backend/database features unless the user explicitly authorizes backend/database integration.

When the user asks generally to “continue,” “start,” “proceed,” or “work on the roadmap,” respond by asking which specific feature should be implemented first.

Recommended clarification prompt:

```text
Which exact frontend item should I implement first from missing-features-roadmap.md? I will keep frontend-only items UI-only unless you explicitly approve backend/database integration.
```

---

## Canonical Files to Read First

Before any implementation, inspect:

1. `frontend-sample.txt` — primary frontend design/styling guide
2. `missing-features-roadmap.md` — sprint tracker and implementation scope
3. `architecture.md` — current system architecture
4. `prompt-template.md` — current workflow rules
5. `frontend/src/api/faqApi.js` — API helper layer
6. Relevant frontend page/component files
7. Relevant backend route files only if the selected item is backend-integrated
8. `backend/openapi.yaml` only if public API usage or documentation is affected
9. `backend/tests/universal.postmerge.diagnostic.test.js` if backend behavior changes

If `frontend-sample.txt` is missing, stop and ask for it.

---

## Frontend-Sample Design Rule

All UI implementation must follow `frontend-sample.txt` as the primary design/styling guide.

Use `frontend-sample.txt` to determine:

- layout density,
- card structure,
- typography hierarchy,
- button styles,
- empty/loading/error states,
- dark/light theme behavior,
- spacing scale,
- badges/chips/tabs styling,
- dashboard/admin layout patterns,
- responsive behavior,
- micro-interactions and visual polish.

Do not introduce an unrelated visual system. If an existing component conflicts with `frontend-sample.txt`, preserve app functionality but align new UI patterns with `frontend-sample.txt` where practical.

---

## Scope Categories

## A. Backend-Integrated Frontend Features

These features may use existing backend routes and API helpers:

1. Contributor leaderboard API integration
2. Export options
3. Import option with AI-powered cleanup of import
4. Translation controls
5. Bounty UI with reputation link
6. Learning paths
7. Notification preferences persistence, if existing backend endpoints are used
8. Revision history/rollback UI, if existing backend endpoints are used
9. Admin needs-update queue, if existing backend endpoints are used

For these features:

- Verify the backend route exists.
- Add/update API helper in `frontend/src/api/faqApi.js`.
- Wire UI to backend data.
- Add loading/empty/error states.
- Update `missing-features-roadmap.md` and `architecture.md`.
- Update `backend/openapi.yaml` if route documentation is missing or clarified.

## B. Frontend-Only Features — No Backend or Database Integration Yet

These features must remain frontend-only until the user explicitly approves backend/database work:

1. Edit UI for FAQ, Query, and Answers
2. Whole moderation dashboard and controls prototype
3. Advanced search UI controls
4. Related questions sidebar
5. Separate FAQ vs Questions section
6. Badges/milestone progress bar based on reputation increments
7. Notifications UI improvement
8. Subscription thread controls and search filters
9. Profile page activity visualization
10. Verified badges on answers from users classified as experts
11. Notification filters: new, old, answers only, questions followed, flags/warnings
12. Translation UI per answer or per question as frontend-only prototype, if not wired to backend

For frontend-only features:

- Do not create backend routes.
- Do not create database schema/migrations.
- Do not create or modify Mongoose models.
- Do not change sync logic.
- Do not change authorization middleware.
- Use mock/local/static/frontend-context data.
- Clearly label mock-only behavior in code comments or roadmap evidence.
- Add TODO notes for future backend integration only if helpful.

---

## Implementation Workflow

After the user selects a specific feature:

1. Confirm whether it is backend-integrated or frontend-only.
2. Read `frontend-sample.txt`.
3. Inspect current relevant frontend files.
4. Plan the minimal set of frontend changes.
5. Implement only that feature.
6. Preserve existing UX and routing unless the selected feature requires changes.
7. Add loading/error/empty states where relevant.
8. Add role-gated UI only if the current auth context supports it.
9. Update `missing-features-roadmap.md` with status/evidence.
10. Update `architecture.md` if app structure or feature status changes.
11. Do not mark a feature fully complete unless its stated scope is complete.

---

## Backend Contract Rule for Integrated Features

When using existing backend APIs, expect standard JSON routes to return:

```json
{
  "status": "success",
  "storage": "sqlite",
  "data": {},
  "meta": {}
}
```

Errors should return:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable message"
}
```

Export/download routes may return raw content or blobs with headers such as:

- `Content-Type`
- `Content-Disposition`

Do not parse raw export responses as normal JSON envelopes.

---

## Feature-Specific Guidance

## 1. Edit Feature for FAQ, Query, Answers

Default scope: **Frontend-only prototype**.

Build edit buttons, edit states, inline forms, validation hints, cancel/save UI, and optimistic local updates. Do not add backend update endpoints unless directly requested.

## 2. Moderation Dashboard and Controls

Default scope: **Frontend-only prototype unless backend moderation routes are explicitly selected**.

Design pending content review interface, flagging controls, approve/reject/escalate actions, confidence badges, reason panels, and queue tabs. If backend routes already exist and the user asks for integration, wire to them; otherwise use mock data.

## 3. Advanced Search UI

Default scope: **Frontend-only UI controls**.

Add category filters, tag filters, sort by newest, sort by votes, and clear filters. Apply filtering client-side unless backend search integration is explicitly requested.

## 4. Related Questions Sidebar

Default scope: **Frontend-only prototype**.

Show related questions based on category/tags/current question context using existing in-memory questions or mock data.

## 5. Separate FAQ vs Questions Section

Default scope: **Frontend-only navigation/layout change**.

Separate resolved FAQ knowledge entries from open/pending community questions in tabs or separate sections.

## 6. Badges/Milestone Progress Meter

Default scope: **Frontend-only visualization**.

Display reputation-based progress bars/meters and next milestone. Use current user reputation from auth/profile context if available; otherwise mock locally.

## 7. Notifications Improvement

Default scope: **Frontend-only UI improvement**.

Improve notification cards, grouping, read/unread display, priority labels, empty states, and toast feedback. Do not add backend preference changes unless selected.

## 8. Subscription Thread Controls + Search Filters

Default scope: **Frontend-only controls**.

Add search/filter controls for followed threads/tags/topics. Use existing subscription data or mock data.

## 9. Profile Page Activity Visualization

Default scope: **Frontend-only visualization**.

Add charts, timeline, heatmap, streak-like displays, or activity cards using existing profile/activity data or mock data.

## 10. Verified Badges for Expert Answers

Default scope: **Frontend-only display rule unless backend verification route is selected**.

Show verified/expert badges for answers by users classified as experts. Use current role/badge data or mock expert labels.

## 11. Notification Filters

Default scope: **Frontend-only filter controls**.

Add filters for:

- new,
- old,
- answers only,
- questions followed,
- flags/warnings.

Filter current notification list client-side unless backend filtering is requested.

## 12. Contributor Leaderboard API Integration

Default scope: **Backend-integrated frontend feature**.

Use `GET /api/contributors/leaderboard` if available. Replace static contributor lists with backend data, preserving fallback data if the API fails.

## 13. Export / Import with AI-Powered Cleanup

Default scope: **Backend-integrated if routes exist; otherwise UI-only prototype**.

Export should handle raw file downloads. Import UI may include upload area, preview, dry-run result, cleanup summary, and confirmation. Do not add backend cleanup endpoints unless requested.

## 14. Translate per Answer or Question

Default scope: **Backend-integrated if translation routes exist; otherwise frontend-only prototype**.

Prefer per-question/per-answer controls over a global Google Translate-page style option. Keep original/translated toggle.

## 15. Bounty UI — Reputation Link

Default scope: **Backend-integrated if bounty routes exist**.

Show reputation cost, available reputation, sponsor form, open bounty state, and award action. Do not modify backend reputation logic unless requested.

## 16. Learning Paths

Default scope: **Backend-integrated if learning path routes exist**.

Add learning path list/detail UI and navigation. Show ordered FAQ items and link to question detail pages.

---

## Required Roadmap Update Format

After implementing any selected item, update `missing-features-roadmap.md` using this structure:

```markdown
## Feature Name

Status: In Progress | Complete | Backend Complete / Frontend Pending | Frontend-Only Prototype Complete | Blocked
Scope: Frontend-only | Backend-integrated
Last Updated: YYYY-MM-DD

Files Changed:
- `frontend/src/...`

Implementation Evidence:
- What was added.
- What data source is used.
- Whether backend is integrated or mocked.

Remaining Gaps:
- Any missing tests, API docs, backend integration, or UX improvements.
```

---

## Testing Expectations

If a frontend test framework exists, add tests for:

- loading states,
- empty states,
- error states,
- rendered API/mock data,
- role-gated controls,
- filter behavior,
- modal open/close behavior,
- optimistic UI updates,
- export/download helper behavior.

If no frontend testing framework is available, record the test gap in `missing-features-roadmap.md`.

Backend diagnostic suite should remain green after any backend-integrated change:

```bash
cd backend
npm test -- universal.postmerge.diagnostic.test.js
```

---

## Safe Editing Rules

1. Always read `frontend-sample.txt` before frontend implementation.
2. Pause and await direct user input before implementing any specific feature.
3. Do not implement multiple roadmap items unless explicitly requested.
4. Keep frontend-only features frontend-only.
5. Do not add backend/database integration unless explicitly requested.
6. Preserve SQLite fallback behavior.
7. Preserve existing auth and role checks.
8. Use `frontend/src/api/faqApi.js` for backend calls.
9. Do not parse export downloads as normal JSON.
10. Add loading, empty, error, and success states.
11. Update `missing-features-roadmap.md` after every feature change.
12. Update `architecture.md` when frontend routes/components or integration state changes.

---

## Final Instruction

This is a controlled frontend sprint. The LLM must wait for the user to choose a specific feature, then implement only that feature within the declared scope. Frontend-only items must remain UI-only prototypes until the user explicitly approves backend or database integration.
