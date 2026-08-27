# Family Hub API — Human-Oriented Companion

This document is a navigable index and narrative companion to
[`openapi.yaml`](../openapi.yaml) at the repo root. **`openapi.yaml` is the
source of truth** — it was hand-authored against the real route handlers in
`backend/src/routes/*.ts` (not guessed from naming conventions), and it is
what `frontend/src/types/api-generated.ts` is generated from
(`npm run generate:api-types --workspace=frontend`). This file exists
because a 60+ endpoint spec is not something you want to read top-to-bottom
to answer "which auth header does this route need?" or "does this endpoint
wrap its response in `data`?" — those are exactly the questions this doc
answers up front.

> This document was written by directly reading every route handler in
> `backend/src/routes/*.ts` and the service/repository code each one calls,
> as of the Batch D SDLC alignment pass. If a route changes, `openapi.yaml`
> and this file both need to be re-verified against source — neither is
> generated from the other automatically (there are no schema annotations
> in the route files themselves for a generator to read).

## Before you read the endpoint list: the three things that will surprise you

### 1. Two incompatible response envelopes, by "route vintage"

**Newer routes** — `chores`, `learning`, `announcements`, `reminders`,
`energy`, `calendar`, `family`, `activity-log`, `smartthings` — always
include a top-level `status: 'success' | 'error'` and a `timestamp` ISO
string. On error, the shape is always:

```json
{ "status": "error", "message": "...", "error": "..." }
```

On success, **most but not all** of these routes nest the payload under a
`data` key, optionally alongside `count`:

```json
{ "status": "success", "data": { ... }, "count": 3, "timestamp": "..." }
```

The exceptions matter: `chores`, `learning`, and `smartthings` frequently
use an endpoint-specific key instead of `data` — e.g. `GET /api/chores`
returns `{ status, chores: [...], count, timestamp }`, not
`{ status, data: [...] }`. `GET /api/learning/stats` returns
`{ status, stats: {...} }`. Check `openapi.yaml` for the literal shape of
each endpoint before assuming `data` exists — this file and the spec both
call this out per-endpoint, not just here.

**Older routes** — `auth`, `users`, `badges`, `points`, `external-apis` —
have no consistent wrapper at all. No `status`, no `timestamp`. Each
endpoint returns its own ad hoc object (e.g. `{ user: {...} }`,
`{ message: "...", entry: {...} }`, `{ count, badges: [...] }`). Errors
look like `{ error: "...", message?: "..." }` with no fixed shape either.
These are documented individually in `openapi.yaml` as `LegacyErrorBody`
plus per-endpoint success schemas.

### 2. `middleware/response-formatter.ts` is dead code

That file installs `res.success()`, `res.created()`, `res.noContent()`,
and `res.paginated()` helpers as global Express middleware (registered in
`server.ts`), producing a *third* envelope shape:
`{ success, data, message?, timestamp, meta? }`. **No route handler in
this codebase calls any of these helpers.** It is registered, unused
infrastructure — grep for `res.success(`, `res.created(`, `res.paginated(`
across `backend/src/routes/` and you will find zero call sites. Do not
write frontend code assuming any endpoint uses this envelope; it isn't
live anywhere. This is flagged here as a worthwhile future cleanup
(either delete the dead middleware, or actually adopt it consistently) —
out of scope for this pass, which documents behavior as it is.

### 3. Three different auth conventions, not one

| Group | Mechanism | Real strength |
|---|---|---|
| `auth`, `users`, `badges`, `points`, `external-apis` | `Authorization: Bearer <token>` header | Presence-checked only. `GET /auth/me` is the sole exception — it actually calls `supabase.auth.getUser(token)`. |
| `chores`, `learning`, `announcements`, `reminders`, `energy`, `calendar`, `family`, `activity-log` | `x-user-id` header | Trusted as-is, no verification at all. A few endpoints within these same route files skip the check entirely — see individual endpoint notes below and in `openapi.yaml` (e.g. `GET /api/energy/usage`, `GET /api/energy/summary`, `GET /api/energy/current-month`, `POST /api/activity/log`, and the PATCH/DELETE-by-id endpoints in `announcements`/`reminders`/`calendar`). |
| `smartthings`, `performance`, `deployment`, `health` | None | Open. |

`openapi.yaml` models these as `bearerAuth` (http bearer) and
`userIdHeader` (apiKey header named `x-user-id`), applied per-path.

### One more quirk: `GET /health` is shadowed

`server.ts` registers a legacy inline `GET /health` handler *before*
mounting `routes/deployment.ts` (which defines its own richer
`GET /health`). Express dispatches to the first matching route
registration, so **the legacy handler always wins** in the running app —
`{ status, timestamp, environment }`, no `uptime`/`version`. The
deployment.ts version (`{ status, timestamp, environment, uptime, version }`)
is real code that is currently unreachable. `openapi.yaml` documents the
richer shape as canonical (since that's the one that *should* be live) but
flags the shadowing directly on that path.

## Endpoint groups

Each group below links to its tag in `openapi.yaml`. "Auth" column values:
**Bearer** = `Authorization: Bearer <token>` (presence-checked, see above),
**x-user-id** = custom header (unverified), **none** = open.

| Group | Base path | Auth | What it does |
|---|---|---|---|
| Health | `/health`, `/api` | none | Liveness checks. See the `/health` shadowing note above. |
| Deployment | `/ready`, `/startup`, `/metrics`, `/info`, `/config` | none | Readiness/startup probes, Prometheus metrics, app info, redacted config (config blocked in prod). |
| Auth | `/auth/*` | Bearer (signup/login exempt) | Signup (parents/admins only — children can't self-register, see COPPA note below), login, logout, current-user. |
| Users | `/users/*` | Bearer | Profile CRUD, parent→children lookup, admin listing. |
| Badges | `/badges/*` | Bearer | Badge catalog, per-user award/revoke, date-range queries. Some GETs fall back to hardcoded demo data (`demo_mode: true`) if the DB call throws — see `GET /badges/users/{userId}`. |
| Points | `/points/*` | Bearer | Points ledger (`activity_points` table): totals, history, breakdown, leaderboard, award/deduct. |
| SmartThings | `/api/smartthings/*` | none | Device listing/control/discovery. Uses a hand-rolled `smartthings_devices` table — **not** the Supabase `smart_devices` table in `types/database.ts`. |
| Chores | `/api/chores/*` | x-user-id | Create/list/complete chores, progress + points summaries. Uses a hand-rolled `chores`/`chore_completions` schema (user_id/name/time_slot/points_value/enabled) — **not** the Supabase `chores` table (which has completely different columns: child_id/priority/status/due_date). |
| Learning | `/api/learning/*` | x-user-id | Lesson completion, quiz answers, phase/overall stats. Same drift issue as Chores: hand-rolled `learning_progress`/`learning_quiz_answers` tables, different columns than the Supabase-generated `learning_progress` type. |
| Announcements | `/api/announcements/*` | x-user-id | Family messaging: create/update/delete, mark-read, read counts. |
| Reminders | `/api/reminders/*` | x-user-id | Scheduled reminders: create/update/delete/dismiss, upcoming/filtered lists. |
| Energy | `/api/energy/*` | x-user-id for goal endpoints; **usage/summary/current-month have no auth check** despite living in this route file | Usage time series, period summaries, goals. |
| Calendar | `/api/calendar/*` | x-user-id (OAuth callback is unauthenticated by nature) | Family events CRUD, Google Calendar OAuth connect/callback/disconnect, Google event fetch, event dismissal, and Google event create/edit/delete (`POST`/`PATCH`/`DELETE /api/calendar/google/events` — parents only). |
| Family | `/api/family/*` | x-user-id | Family creation, membership, invitations, child account provisioning (the only legitimate path to create a child account — see COPPA note), settings. |
| ActivityLog | `/api/activity/*` | x-user-id for feed/stats; **`POST /log` has no auth check at all** (target user comes from the request body) | Dashboard activity feed and stats. |
| ExternalAPIs | `/api/external/*` | Bearer | Merriam-Webster dictionary, OpenWeather, SendGrid email passthroughs. All cached (dictionary 7d/24h, weather 10min–1h). |
| Performance | `/performance/*` | none | Query/request/compression diagnostics, index recommendations. |

### COPPA note (children accounts)

`POST /auth/signup` explicitly rejects `role: 'child'` — self-registration
of a child account is not possible. The only way to create one is
`POST /api/family/children`, callable only by an existing parent/admin
member of a family (403 otherwise). This is FRAMEWORK.md Decision #29.

## Known behavioral quirks worth knowing before you build against this API

These are documented in detail on the relevant path in `openapi.yaml`;
summarized here for scanning:

- **Two-table drift**: `chores`, `learning`, and `smartthings` feature
  areas read/write hand-rolled Postgres tables that do not match the
  similarly-named tables in the generated `types/database.ts` Supabase
  schema. If you're tempted to reuse a `Tables<'chores'>['Row']` type for
  anything touching `/api/chores/*`, don't — it describes a different
  table than the one the route actually queries.
- **`users.birth_year` / `users.is_under_13`** are real, live columns
  (read/written by `UserRepository` and `POST /api/family/children`) but
  are missing from the generated `types/database.ts` — that generated file
  is stale relative to the live schema for this table.
- **`GET /api/smartthings/devices/:deviceId/history`** queries a
  `point_transactions` table that doesn't appear in `types/database.ts` at
  all. Response rows are passed through untyped.
- **PATCH endpoints across `announcements`, `reminders`, `calendar`, and
  `family/settings`** pass `req.body` straight to a raw SQL `UPDATE`, with
  only a column-name whitelist standing between the request and the query
  — there's no schema validation of value types. The whitelists are
  documented per-endpoint in `openapi.yaml`.
- **`GET /api/calendar/google/events`** can 401 with a structured
  `{ status: 'error', code: 'TOKEN_REFRESH_FAILED' | 'NO_REFRESH_TOKEN', message, error }`
  body when the user's Google OAuth grant has expired and can't be
  silently refreshed — the frontend needs to send the user back through
  `GET /api/calendar/auth/google` in that case.
- **`POST`/`PATCH`/`DELETE /api/calendar/google/events`** (B-lite): Google is
  the source of truth. Create writes to the caller's `primary` Google calendar
  then best-effort mirrors a `calendar_events` row tagged with `google_event_id`
  so non-attendee family members still see it (mirror write failure → `mirrorId:
  null`, request still 201s). Edit/delete only work on events with a mirror row,
  and only for the row's `created_by_id` (403 otherwise). Google 404/410 on
  edit/delete is treated as "already gone" — the stale mirror row is dropped.
  Parents/admins only (403 otherwise). Same 401 structured-error contract as the
  read endpoint.
- **`POST /api/family/members/accept-invitation`** returns 400 for *every*
  failure mode, including unexpected/server errors, not just validation
  failures — don't assume a 400 here always means "bad input."

## Systemic gaps noted but intentionally not fixed in this pass

- `middleware/response-formatter.ts` (see above) — worth deleting or
  actually adopting, not both left in this half-alive state.

Three superseded API docs (`docs/API-REFERENCE.md`, `docs/API_ENDPOINTS.md`,
`docs/API_ENDPOINTS_COMPLETE.md`) were retired in favor of `openapi.yaml` +
this file as the single source of truth.

## Regenerating types from the spec

```bash
cd frontend
npm run generate:api-types   # writes src/types/api-generated.ts from ../openapi.yaml
```

The generated file is not wired into any hook or component yet (by
design — that's separate follow-up work). It exists so accurate request/
response types are available to opt into incrementally.
