# Open Learning 

Learn anything. Learn together. Grow together. Next.js 16 + Supabase + LiveKit. School, JEE, NEET and Language Learning (preferences, voice/chat rooms, community posts and stories).

## Run locally (no credentials needed to start)
```bash
npm install
cp .env.example .env.local   # already created; fill values as you get them
npm run dev                  # http://localhost:3000
```
Without keys the landing page, onboarding step 1 and all static UI work. Features that need a service show a
"not configured" notice instead of crashing.

## Environment variables (`.env.local`, never committed)
| Variable | Needed for | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sign-in, dashboard, videos, groups, friends | Supabase → Project settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` (server only) | applying the onboarding name after first sign-in | same page. Never expose |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in | Google Cloud Console → OAuth client. **Paste into Supabase → Auth → Providers → Google**; the app does not read them |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (server only) | voice rooms, friend calls | LiveKit Cloud project |
| `GOOGLE_SHEETS_API_KEY` *or* `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | importing videos from a Google Sheet | Google Cloud (Sheets API enabled). Service account: share the sheet with its email as Viewer |
| `CRON_SECRET` (server only) | daily story-file cleanup (`/api/cron/purge-stories`, scheduled in `vercel.json`) | any long random string; Vercel sends it as a bearer token |
| `NEXT_PUBLIC_SITE_URL` | not read yet | your domain |

## Setup steps once you have keys
1. **Supabase**: create a project; run `supabase/migrations/0001…0008_*.sql` in order (SQL editor or `supabase db push`; `supabase/ALL_MIGRATIONS.sql` is the same thing in one file).
   This creates tables, RLS, year-wise Student IDs, 27 general groups, and the Language Learning community (0008, including the private `community-media` storage bucket).
2. **Google OAuth**: Google Cloud → OAuth client (Web). Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   Enable the Google provider in Supabase and add `http://localhost:3000/auth/callback` (and your production URL) to Auth → URL configuration → Redirect URLs.
3. **First admin**: sign in once, then in the SQL editor: `update public.profiles set role='admin' where email='you@example.com';`
4. **LiveKit**: create a LiveKit Cloud project; copy URL/key/secret to `.env.local`.
5. **Videos**: Admin → Videos → download the Excel template, fill it (or use a Google Sheet with the same headers), then preview and import.
6. Restart `npm run dev`.

## Deploying
See `docs/DEPLOYMENT.md` (Vercel + Supabase + Google + LiveKit checklist and env var table).

## Tests
```bash
npm run lint && npx tsc --noEmit && npm run build
npx vitest run                         # unit tests: parsing, validation, filters, language helpers
bash supabase/tests/run-local.sh       # local throwaway Postgres in .local-db/ : migrations + RLS/ID/authorisation tests
```

## Routes (category-scoped)
`/learn/[category]` (school | jee | neet | languages; languages adds `setup`, `preferences`, `voice`, `chat`, `community`) → `self-learning/{videos,papers,tests}` and `friends/{discussion,chat,voice}/{create,mine,general,[groupId]}`, `friends/my-friends`, `friends/games`, `friends/call/[callId]`, `friends/join/[code]`. Admin: `/admin/*`.

## Security notes
Roles and Student IDs are immutable for students (column grants + trigger + RLS). Messages and voice tokens require group membership,
enforced in the database and in `/api/livekit-token`. Excel uploads: `.xlsx` only, 4 MB, 10,000 rows, magic-byte check. Sheet URLs: strict
`docs.google.com/spreadsheets/d/<id>` allow-list, fetched server-side. Secrets are server-only.

## Known limits
Invite links require being signed in; after sign-in you land on the dashboard and must open the link again. Voice presence in the database can
linger if a browser crashes; the LiveKit room is the live source. Question Papers, Tests and Games are intentionally placeholders.
Expired stories vanish from the app immediately, but their image files are only deleted when the daily cron runs (needs `CRON_SECRET`; see `docs/DEPLOYMENT.md`).
