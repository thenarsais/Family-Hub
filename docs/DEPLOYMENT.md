# Deployment Plan (FR-118)

Status: **planned, not yet executed.** This is the output of the FR-118 planning
session (2026-09-06). It records the decisions and the runbook; nothing is
deployed until the home box exists.

---

## Decisions

| Question | Decision |
|---|---|
| Reach from outside the home? | **Yes** — family phones need it on cellular. |
| Backend host | **A home mini-PC** (to be purchased — small always-on Linux box). |
| Frontend host | **Cloudflare Pages** (free static host, auto-deploys from `main`). |
| Public ingress for the backend | **Cloudflare Tunnel** (`cloudflared` on the box → public HTTPS hostname, no port-forwarding, home IP never exposed). |
| Database | **Supabase managed Postgres**, prod project. Only work is applying migrations 001–010. |
| Deploy trigger | **Split** — frontend auto (Pages builds on push); backend **manual scripted** (`./scripts/deploy.sh` on the box). Rationale below. |
| Redis | **Yes, a tiny container.** The prod env check (`config/environment.ts`) requires `REDIS_URL`; a 5 MB `redis:7-alpine` alongside the API satisfies it and gives real cross-restart caching for weather/dictionary. |

### Why manual backend deploy

The box is internet-facing (via the tunnel). Putting a GitHub deploy key or a
self-hosted runner on it widens the attack surface and adds a failure mode, for
a project where the backend changes land maybe once a week. A 20-second
`ssh box 'cd ~/family-hub && ./scripts/deploy.sh'` is more robust. Upgrade path
if that ever chafes: publish a GHCR image from CI and have the box pull it via a
`cloudflared`-routed webhook, or add a self-hosted runner.

---

## Architecture

```
                     ┌─────────────  Cloudflare (free plan)  ─────────────┐
                     │                                                     │
   family phones ───►│  Cloudflare Pages            Cloudflare Tunnel      │
   wall display ────►│  hub.<domain>                api.<domain>           │
   (anywhere, HTTPS) │  (static SPA, built from     (cloudflared daemon    │
                     │   the repo on push to main)   on the home box)      │
                     └───────┬──────────────────────────────┬─────────────┘
                             │ VITE_API_URL = api.<domain>  │
                             │                              ▼
                             │                    ┌──────────────────────┐
                             │                    │  Home mini-PC (Linux)│
                             │                    │  Docker:             │
                             │                    │   • family-hub-api   │
                             │                    │   • redis            │
                             │                    │   • cloudflared      │
                             │                    └──────────┬───────────┘
                             │                               │ DATABASE_URL / SUPABASE_*
                             ▼                               ▼
                    (browser also talks         ┌──────────────────────────┐
                     directly to Supabase       │  Supabase (managed)      │
                     for auth via the anon key) │  prod project            │
                                                │  migrations 001–010      │
                                                └──────────────────────────┘
```

Everything the family hits is `*.<domain>` behind Cloudflare, TLS terminated by
Cloudflare. The home box has **no inbound ports open** — `cloudflared` makes only
outbound connections.

---

## What you need to acquire / decide

- [ ] **A domain.** ~$10/yr. Put it on Cloudflare (free plan). Without one you
      can still ship on `*.pages.dev` + a `*.cfargotunnel.com` hostname, but a
      real domain is cleaner for the OAuth redirect URI and for the family to
      remember. **This is the one recurring cost.**
- [ ] **The mini-PC.** Target spec: 4 GB RAM, an x86-64 or ARM64 CPU, ~30 GB
      disk, wired ethernet, runs Linux (Debian/Ubuntu Server or Raspberry Pi
      OS). A Raspberry Pi 5 (8 GB) or any refurbished mini-PC (~$120–200)
      covers it comfortably — the API idles well under 512 MB.
- [ ] **Confirm the prod Supabase project.** `family-hub-dev` is dev-only.
      There is a separate prod project (paused/restored 2026-09-04); confirm it
      is live and grab its `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the
      session-pooler `DATABASE_URL`.
- [ ] **Rotate the OpenWeather API key** — the current one was pasted in chat.

---

## Runbook

### 1. Cloudflare + domain (one-time)

1. Add the domain to Cloudflare (free plan), update the registrar's nameservers.
2. Decide the two hostnames, e.g. `hub.example.com` (frontend) and
   `api.example.com` (backend).

### 2. Supabase prod (one-time)

1. Confirm the prod project is unpaused.
2. Apply migrations **001 → 010** in order (the same one-off `pg` script used
   for dev, pointed at the prod `DATABASE_URL`). Skip `003_seed_demo_users.sql`
   — that seeds demo accounts, not wanted in prod.
3. Verify `NOTIFY pgrst, 'reload schema'` ran (last line of the recent
   migrations) or restart PostgREST from the Supabase dashboard.
4. Note the RLS/GRANT caveats in the `supabase-rls-permissions` memory — verify
   `service_role` has table grants on the live prod DB before trusting it.

### 3. Frontend — Cloudflare Pages (one-time, then automatic)

1. Create a Pages project, connect the GitHub repo, branch `main`.
2. Build settings:
   - Build command: `npm ci && npm run build --workspace=frontend`
   - Build output directory: `frontend/dist`
   - Root directory: repo root (the build is workspace-aware)
3. Environment variables (Production):
   ```
   VITE_API_URL=https://api.example.com
   VITE_SUPABASE_URL=<prod supabase url>
   VITE_SUPABASE_ANON_KEY=<prod anon key>
   VITE_SENTRY_DSN=<optional>
   ```
4. Assign the custom domain `hub.example.com` to the Pages project.
5. From here, every push to `main` rebuilds and deploys the frontend. No action.

### 4. Backend — the home box (one-time)

1. Install Docker + the compose plugin. Install `cloudflared`
   (`cloudflared service install` with a tunnel token from the Cloudflare
   Zero-Trust dashboard).
2. In the Cloudflare tunnel config, route `api.example.com` → `http://localhost:3000`.
3. `git clone` the repo to `~/family-hub`.
4. `cp backend/.env.production.example backend/.env.production` and fill it in
   (see that file for every key). This file is gitignored — it never leaves the
   box.
5. `./scripts/deploy.sh` — builds the image, starts `api` + `redis`, waits for
   the healthcheck.
6. Smoke-test: `curl https://api.example.com/health` from a phone on cellular.

### 5. Google OAuth (one-time)

1. In Google Cloud Console → the existing OAuth client, add
   `https://api.example.com/auth/google/callback` to **Authorized redirect
   URIs** (the legacy root path is intentional — see FR-119 / T-19; it 302s to
   the calendar callback).
2. Set `BACKEND_URL=https://api.example.com` in `backend/.env.production` so the
   backend builds that exact redirect URI.
3. Each family member re-runs "Connect Google Calendar" once against prod.

### 6. Ongoing deploys

- **Frontend:** merge to `main` → Cloudflare Pages rebuilds. Nothing to do.
- **Backend:** `ssh box 'cd ~/family-hub && ./scripts/deploy.sh'`. The script
  does `git pull`, rebuilds the image, and restarts with a healthcheck gate.
- **DB migrations:** a new `backend/migrations/NNN_*.sql` must be applied to prod
  by hand (same `pg` script) as part of that backend deploy — the app does not
  auto-migrate.

---

## Wall display

The kitchen screen is a browser in kiosk mode pointed at `https://hub.example.com`.
The device-auth / profile-picker / parent-PIN model for it is **T-14**, a
separate task that depends on this deploy existing.

---

## Deliberately out of scope

- The dev `docker-compose.yml` (Postgres, Redis, ELK, Prometheus, Grafana) is a
  local tooling stack and is **not** used in prod. `docker-compose.prod.yml` is
  the prod file. Slimming the dev one is a separate cleanup.
- `.github/workflows/deploy.yml` (Swarm/SSH stubs) stays disabled — the split
  trigger above replaces it. Delete or rewrite it in a later pass.
- CDN/edge caching, blue-green, autoscaling — a single household does not need
  any of it.

---

## Costs

| Item | Cost |
|---|---|
| Domain | ~$10 / year |
| Cloudflare (Pages + Tunnel + DNS) | $0 (free plan) |
| Supabase | $0 while under the free tier's limits; $25/mo Pro if PITR backups or the paused-project timeout become a problem |
| Mini-PC | ~$120–200 one-time + a few $/yr electricity |
| **Recurring** | **~$10/yr** (domain), everything else free unless Supabase Pro |
