# Catalyst — Cleveland Brothers Campaign Code Portal

Internal platform for governing campaign taxonomy, approving codes, and building tracked UTM links. Next.js + Neon Postgres, deployable free on Vercel.

## What's in this version

- **Real auth + roles** — email + password sign-in (bcrypt-hashed), session cookies (JWT), four roles (viewer / user / approver / admin) enforced on every API route. Admins can invite additional users from the **Users** page. Swap for SSO later without touching the rest.
- **Approval workflow** — anyone can *request* a code; approvers/admins approve, reject, or request changes from a review queue. Approved codes enter the registry as `active`.
- **Code lifecycle** — `pending → active → deprecated → retired → archived` (+ `rejected`), with a state machine that blocks invalid transitions. Only `active`/`deprecated` codes can build links.
- **Audit log** — every create, status change, approval, and link generation is recorded with actor, timestamp, and before/after.
- **Shared database** — all of the above is in Postgres, so it works across users (unlike the old browser-only prototype).
- **UTM links** — build from an approved code, auto-copy, logged to history, immersive red Cat-website branding.
- **Link Hub (self-hosted short links + QR)** — shorten any URL through our own redirect engine at `/s/<slug>`, generate a scalable QR code, and track clicks/scans in-house (device, referrer, country). No third-party dependency.
- **Taxonomy editor** — admins grow the controlled vocabulary (business units, initiatives, campaigns).

## Local development

```bash
npm install
cp .env.example .env.local      # then fill in DATABASE_URL and AUTH_SECRET
npm run db:setup                # create tables
ADMIN_PASSWORD='YourStrongPassword' npm run db:seed   # taxonomy + codes + admin (tburket@clevelandbrothers.com)
npm run dev                     # http://localhost:3000
```

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. In Vercel: **New Project → import the repo**. Framework auto-detects as Next.js.
3. **Storage → Create → Neon (Postgres)**, attach it to the project. Vercel injects `DATABASE_URL` automatically.
4. **Settings → Environment Variables**: add `AUTH_SECRET` (run `openssl rand -base64 32` for a value).
5. Deploy. Then run the DB scripts once against the production DB:
   ```bash
   # locally, with the production DATABASE_URL exported:
   DATABASE_URL="<neon url>" npm run db:setup
   DATABASE_URL="<neon url>" ADMIN_PASSWORD='YourStrongPassword' npm run db:seed
   ```
   (Or use Neon's SQL console: paste `db/schema.sql`, then run the seed locally pointed at prod.)

## Roles

| Role     | Can do |
|----------|--------|
| viewer   | Browse codes, taxonomy, dashboard |
| user     | + request new codes, build UTM links |
| approver | + approve/reject requests, change code lifecycle, view audit log |
| admin    | + edit taxonomy, full access |

Seeded user: **Ty Burket** — `tburket@clevelandbrothers.com` (admin). Add more from the in-app **Users** page (admin only) or via the seed script.

## Next features on the roadmap

Analytics round-trip (GA4 data per code), SSO, public API + webhooks, notifications, templates, bulk operations, link shortening + QR. The schema and route structure are set up to grow into these.
