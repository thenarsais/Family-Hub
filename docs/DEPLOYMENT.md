# Deployment Plan (FR-118)

Status: **planned, not yet executed.** This is the output of the FR-118 planning
session (2026-09-06). It records the decisions and the runbook; nothing is
deployed until the home box exists.

The primary path below is **fully free / $0 recurring**. A Cloudflare-Tunnel
variant (needs a paid domain, ~$10/yr) is kept at the end for later if the
`*.ts.net` hostname ever chafes.

---

## Decisions

| Question | Decision |
|---|---|
| Reach from outside the home? | **Yes** — family phones need it on cellular. |
| Backend host | **A home mini-PC** (to be purchased — small always-on Linux box). |
| Frontend host | **Cloudflare Pages** on the free `*.pages.dev` hostname (auto-deploys from `main`). |
| Public ingress for the backend | **Tailscale Funnel** — `tailscale funnel 3000` on the box → a stable `https://<box>.<tailnet>.ts.net` URL with a real Let's Encrypt cert, no port-forwarding, home IP never exposed. Free for personal use. |
| Database | **Supabase managed Postgres**, prod project. Only work is applying migrations 001–018 + the learning & trivia seeds. |
| Deploy trigger | **Split** — frontend auto (Pages builds on push); backend **manual scripted** (`./scripts/deploy.sh` on the box). Rationale below. |
| Redis | **Yes, a tiny container.** The prod env check (`config/environment.ts`) requires `REDIS_URL`; a 5 MB `redis:7-alpine` alongside the API satisfies it and gives real cross-restart caching for weather/dictionary. |

### Why Tailscale Funnel (not port-forwarding, not a paid domain)

Funnel gives the same properties the plan wanted from a tunnel — a **stable**
public HTTPS hostname, a valid cert, and **outbound-only** connections so the
home router needs no open ports and the residential IP is never exposed (also
survives CGNAT, which kills classic DDNS + port-forwarding). It costs nothing
and needs no domain. The only downsides: the hostname is ugly
(`familyhub-box.tail1a2b3c.ts.net`), Funnel serves only ports 443/8443/10000
(fine — we use 443), and Tailscale positions it as personal / low-traffic
(a single household is nothing). Enable Funnel once in the Tailscale admin
console for the tailnet.

### Why manual backend deploy

The box is internet-facing (via Funnel). Putting a GitHub deploy key or a
self-hosted runner on it widens the attack surface and adds a failure mode, for
a project where the backend changes land maybe once a week. A 20-second
`ssh box 'cd ~/family-hub && ./scripts/deploy.sh'` is more robust. Upgrade path
if that ever chafes: publish a GHCR image from CI and have the box pull it via a
webhook, or add a self-hosted runner.

---

## Architecture

```
   family phones ───►  Cloudflare Pages            Tailscale Funnel
   wall display ────►  family-hub.pages.dev        <box>.<tailnet>.ts.net
   (anywhere, HTTPS)   (static SPA, built from     (tailscaled on the box;
                        the repo on push to main)   HTTPS + LE cert, no ports)
                             │                              │
                             │ VITE_API_URL =               ▼
                             │  <box>.<tailnet>.ts.net   ┌──────────────────────┐
                             │                           │  Home mini-PC (Linux)│
                             │                           │  Docker:             │
                             │                           │   • family-hub-api   │
                             │                           │   • redis            │
                             │                           │  host service:       │
                             │                           │   • tailscaled       │
                             │                           └──────────┬───────────┘
                             │                                      │ DATABASE_URL / SUPABASE_*
                             ▼                                      ▼
                    (browser also talks              ┌──────────────────────────┐
                     directly to Supabase            │  Supabase (managed)      │
                     for auth via the anon key)      │  prod project            │
                                                     │  migrations 001–018      │
                                                     └──────────────────────────┘
```

The home box has **no inbound ports open** — `tailscaled` makes only outbound
connections and Tailscale's edge terminates TLS and forwards to `localhost:3000`.

---

## What you need to acquire / decide

- [ ] **The mini-PC.** Target spec: 4 GB RAM, an x86-64 or ARM64 CPU, ~30 GB
      disk, wired ethernet, runs Linux (Debian/Ubuntu Server or Raspberry Pi
      OS). A Raspberry Pi 5 (8 GB) or any refurbished mini-PC (~$120–200)
      covers it comfortably — the API idles well under 512 MB.
- [ ] **A Tailscale account** (free, personal). Sign in with the same Google
      account the family already uses.
- [ ] **Confirm the prod Supabase project.** `family-hub-dev` is dev-only.
      There is a separate prod project (paused/restored 2026-09-04); confirm it
      is live and grab its `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and the
      session-pooler `DATABASE_URL`.
- [ ] **Rotate the OpenWeather API key** — the current one was pasted in chat.
- [ ] *(Optional, not now)* a domain — only if you later want pretty hostnames
      or move to the Cloudflare-Tunnel variant. ~$10/yr.

**Recurring cost of the primary path: $0** (unless Supabase Pro is needed later).

---

## Runbook

### 1. Supabase prod (one-time)

1. Confirm the prod project is unpaused.
2. Apply migrations **001 → 018** in order (the same one-off `pg` script used
   for dev, pointed at the prod `DATABASE_URL`). Skip `003_seed_demo_users.sql`
   — that seeds demo accounts, not wanted in prod.
3. Run **`npm run seed:learning`** and **`npm run seed:trivia`** (backend,
   pointed at the prod `DATABASE_URL`) — the first upserts the 177 Gujarati
   lessons into `learning_lessons`, the second the 111 questions into
   `trivia_questions`. Both idempotent; safe to re-run after a content edit.
4. Verify `NOTIFY pgrst, 'reload schema'` ran (last line of the recent
   migrations) or restart PostgREST from the Supabase dashboard.
5. Note the RLS/GRANT caveats in the `supabase-rls-permissions` memory — verify
   `service_role` has table grants on the live prod DB before trusting it.

### 2. The home box — Tailscale (one-time)

1. Install Docker + the compose plugin.
2. Install Tailscale, `sudo tailscale up`, sign in. Give the box a clear name
   (e.g. `familyhub-box`) in the admin console — this becomes part of the URL.
3. In the Tailscale admin console: enable **HTTPS certificates** for the tailnet
   and enable **Funnel** (Settings → Funnel, or an ACL `nodeAttrs` entry
   granting `funnel` to the box).
4. Bring the API up first (step 3), then:
   `sudo tailscale funnel --bg 3000`
   (exposes local `:3000` on the tailnet's public HTTPS `:443`). Confirm with
   `tailscale funnel status` — it prints the `https://<box>.<tailnet>.ts.net`
   URL. **That URL is stable** as long as the machine name and tailnet name
   don't change. Note it down — it's `BACKEND_URL` and `VITE_API_URL`.

### 3. Backend — bring up the container (one-time, then per deploy)

1. `git clone` the repo to `~/family-hub`.
2. `cp backend/.env.production.example backend/.env.production` and fill it in
   (see that file for every key; `BACKEND_URL` = the `.ts.net` URL from step 2).
   This file is gitignored — it never leaves the box.
3. `./scripts/deploy.sh` — builds the image, starts `api` + `redis`, waits for
   the healthcheck.
4. Smoke-test: `curl https://<box>.<tailnet>.ts.net/health` from a phone on
   cellular (Wi-Fi off).

### 4. Frontend — Cloudflare Pages (one-time, then automatic)

1. Create a Pages project, connect the GitHub repo, branch `main`. Accept the
   default `family-hub.pages.dev` hostname (no custom domain needed).
2. Build settings:
   - Build command: `npm ci && npm run build --workspace=frontend`
   - Build output directory: `frontend/dist`
   - Root directory: repo root (the build is workspace-aware)
3. Environment variables (Production):
   ```
   VITE_API_URL=https://<box>.<tailnet>.ts.net
   VITE_SUPABASE_URL=<prod supabase url>
   VITE_SUPABASE_ANON_KEY=<prod anon key>
   VITE_SENTRY_DSN=<optional>
   ```
4. From here, every push to `main` rebuilds and deploys the frontend. No action.

### 5. Google OAuth (one-time)

1. In Google Cloud Console → the existing OAuth client, add
   `https://<box>.<tailnet>.ts.net/auth/google/callback` to **Authorized
   redirect URIs** (the legacy root path is intentional — see FR-119 / T-19;
   it 302s to the calendar callback).
2. Set `BACKEND_URL=https://<box>.<tailnet>.ts.net` in `backend/.env.production`
   so the backend builds that exact redirect URI.
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

The kitchen screen is a browser in kiosk mode pointed at
`https://family-hub.pages.dev`. The device-auth / profile-picker / parent-PIN
model for it is **T-14**, a separate task that depends on this deploy existing.

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
| Cloudflare Pages (`*.pages.dev`) | $0 |
| Tailscale (personal, Funnel) | $0 |
| Supabase | $0 while under the free tier's limits; $25/mo Pro if PITR backups or the paused-project timeout become a problem |
| Mini-PC | ~$120–200 one-time + a few $/yr electricity |
| **Recurring** | **$0** (unless Supabase Pro) |

---

## Alternative: Cloudflare Tunnel (needs a domain, ~$10/yr) — for later

Swap the ingress if the `*.ts.net` hostname becomes annoying (family can't
remember it, or you want `hub.` / `api.` on your own name):

1. Register a domain, add it to Cloudflare (free plan), point the registrar's
   nameservers at Cloudflare.
2. Install `cloudflared` on the box (`cloudflared service install <tunnel-token>`
   from the Cloudflare Zero-Trust dashboard).
3. Route a public hostname `api.<domain>` → `http://localhost:3000` in the
   tunnel config.
4. Assign `hub.<domain>` as the custom domain on the Pages project.
5. Update `BACKEND_URL`, `VITE_API_URL`, and the Google OAuth redirect URI to
   the `api.<domain>` form; re-run "Connect Google Calendar".

Everything else (the box, the containers, the deploy script, Supabase) is
identical. It's purely an ingress + hostname swap.
