# Deployment checklist (Vercel + Supabase)

Status: NOT deployed. The directory is not a git repository and has no remote, so nothing can be pushed yet.

## Verified locally (Next.js 16.4.6)
- `npx tsc --noEmit`: clean. `npx eslint src`: clean. `npx vitest run`: see README for the current count (language modules add more). `npm run build`: succeeds (36 pages; routes are Partial Prerender, `proxy.ts` is recognised as the Proxy).
- `cacheComponents: true` is on; every app route reads the session so pages stream dynamically. No `middleware.ts` exists (correct for this Next version).

## 1. Git (blocked until done)
1. `git init`, review `git status` against `.gitignore` (excluded: `.env*` except `.env.example`, `.local-db/`, `.work/`, `.next`, `node_modules`, `*.tsbuildinfo`, `next-env.d.ts`, `.vercel`, `.DS_Store`, `.mcp.json`, `.impeccable/`).
2. Create an empty GitHub repo, `git remote add origin <url>`, first commit, push.
3. Decide on data files (see "Decisions" below) before the first commit: history is permanent.

## 2. Environment variables (Vercel -> Project -> Settings -> Environment Variables; set for Production and Preview)
| Name | Scope | Required | Notes |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | browser-safe (inlined at build) | yes | redeploy after changing |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | browser-safe (inlined at build) | yes | redeploy after changing |
| SUPABASE_SERVICE_ROLE_KEY | server only | yes | auth callback applies onboarding name. Never prefix NEXT_PUBLIC |
| LIVEKIT_URL | server only | for voice/calls | wss://... returned to authorised members with their token |
| LIVEKIT_API_KEY | server only | for voice/calls | |
| LIVEKIT_API_SECRET | server only | for voice/calls | |
| GOOGLE_SHEETS_API_KEY | server only | optional | Sheet import, public sheets |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | server only | optional | private sheets |
| GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY | server only | optional | paste with literal `\n` or real newlines; check `src/lib` parsing handles it |
| CRON_SECRET | server only | yes, for story cleanup | random string (`openssl rand -hex 32`). Vercel Cron sends it as `Authorization: Bearer ...` to `/api/cron/purge-stories`; without it the route answers 401 and expired story files are never deleted |
| NEXT_PUBLIC_SITE_URL | browser-safe | no | not read by current code |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | not read by the app | n/a | configured inside Supabase, not Vercel |

## 3. Supabase
1. Run the migrations in order: `supabase/migrations/0001` ... `0008` (SQL editor or `supabase db push`). `supabase/ALL_MIGRATIONS.sql` is the concatenation of all eight (use either, not both).
   - 0005 grants the service role table access; 0006 lets admins insert import reports; 0007 backfills `onboarded_at`.
   - **0008 (language community)** adds `language_profiles`, language rooms (columns on `groups`), posts, likes, comments, stories, and creates the **private storage bucket `community-media`** (5 MB, jpeg/png/webp/gif) with its `storage.objects` policies. It is created by the migration itself; verify in Storage that the bucket exists and is NOT public. The migration needs the `storage` schema, which every Supabase project has.
   - 0008 also revokes `purge_expired_stories()` from `anon`/`authenticated`; only the service role may run it.
2. Auth -> URL Configuration: Site URL = `https://<prod-domain>`. Redirect URLs: `https://<prod-domain>/auth/callback`, `http://localhost:3000/auth/callback`; for preview deployments add `https://*-<team>.vercel.app/auth/callback`.
3. Auth -> Providers -> Google: enable, paste the Google client ID/secret.
4. Make yourself admin: `update public.profiles set role='admin' where email='you@example.com';`
5. Realtime: `messages`, `friend_calls`, `voice_participants` are added to the `supabase_realtime` publication by 0002; confirm Realtime is enabled for the project.

## 3b. Story cleanup cron (language community)
- Stories disappear from the app the moment they expire (RLS hides them: `expires_at > now()`), but the image FILES stay in the `community-media` bucket and the rows stay in the table until `/api/cron/purge-stories` runs. Nothing deletes them automatically otherwise.
- `vercel.json` schedules that route daily at 03:00 UTC. Set `CRON_SECRET` in Vercel (Production) and redeploy; Vercel then adds the bearer header itself. Vercel Cron only runs on Production deployments, and Hobby plans allow once-per-day schedules, which is what is configured.
- The route uses the service role (`SUPABASE_SERVICE_ROLE_KEY`) to call `purge_expired_stories()` and remove the returned files in batches of 100. Check the run in Vercel -> Project -> Cron Jobs / Logs. A manual run: `curl -H "Authorization: Bearer $CRON_SECRET" https://<prod-domain>/api/cron/purge-stories` (do not paste the secret into shared history).
- Unreferenced uploads (a user uploads an image and never posts it) are not covered by this job; the bucket policy lets owners delete their own files.

## 4. Google Cloud Console
- OAuth client (Web). Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (the Supabase one, NOT the app's). Authorised JS origin: `https://<prod-domain>`.
- OAuth consent screen: set to Production (or add test users) before real students sign in.
- Sheets API enabled only if using sheet import.

## 5. LiveKit
Create a LiveKit Cloud project; put URL/key/secret into Vercel. Language voice rooms enforce their participant cap in the database (`voice_join`, SQLSTATE 53400 `room is full`) before `/api/livekit-token` mints a token; clients heartbeat every ~30s and a participant unseen for 90s stops counting. Mic is allowed by Permissions-Policy (`microphone=(self)`); camera is disabled.

## 6. Vercel project
- Import the GitHub repo; framework auto-detected as Next.js; build `next build`; `vercel.json` only defines the daily story-purge cron. Node 20+/22 runtime.
- Add the domain and make sure the Supabase Site URL matches it exactly.

## Findings and risks
- Callback origin: `/auth/callback` redirects using `request.nextUrl.origin` (Vercel sets the correct host), and the client sends `redirectTo = window.location.origin + /auth/callback`. No site-URL env var is needed, but the exact origin must be in Supabase Redirect URLs or Supabase falls back to Site URL.
- Upload size: the app cap is 10 MB (`MAX_FILE_BYTES` in `src/lib/videos/xlsx.ts`; README says 5 MB / 5000 rows, code says 10 MB / 10000 rows). Vercel Functions reject request bodies over 4.5 MB (HTTP 413) before the code runs, so `.xlsx` uploads between 4.5 and 10 MB will fail in production. Options: lower the cap to ~4 MB, or use the Google Sheet import path / direct-to-Supabase-Storage upload for large files. Fix README or code to agree.
- Runtime: `exceljs` and `livekit-server-sdk` require Node APIs. No route sets `runtime`, and the default is Node.js, which is correct. Do NOT add `runtime = "edge"`. `server-only` is used for secrets.
- `sameOrigin()` compares the Origin header to Host; works on Vercel production domains and previews.
- Security headers are set in `next.config.ts`; no CSP is configured (consider adding, LiveKit needs wss: and YouTube embeds need frame-src).
- `allowedDevOrigins` only affects dev.
- `package.json` has no `test` script; recommend `"test": "vitest run"` (use `npx vitest run` meanwhile). `vitest.config.ts` emits a Vite CJS warning (harmless; rename to `.mts` to silence).
- Voice presence can linger after crashes (documented known limit).

## Pushing to GitHub (no repo exists yet; run these yourself)
```bash
cd /Users/suhail/Desktop/Open-Learning
git init -b main
git status --short            # review: no .env*, .local-db, .work, .next, node_modules should appear
git add -A && git commit -m "Initial commit"
git remote add origin git@github.com:<you>/<repo>.git   # create an EMPTY repo first, no README
git push -u origin main
```
`.env.local` holds real keys and is ignored; if it was ever committed or pasted somewhere, rotate those keys.

## Decisions for the owner before first commit
- `Open-Learning-Videos.xlsx` (user data, source of the video library; ~210 KB) and the `.backup-before-expansion.xlsx`: commit the main workbook if it is the seed source of truth; the backup is better kept out of git (it is now matched by `*.backup-*.xlsx` in .gitignore) or deleted later by the owner.
- `verified_videos.csv`, `missing_coverage.csv`: generated artifacts; commit only if you want them reproducible, else ignore. `docs/*.json|md` reports are fine to commit.
- `.claude/` (launch.json, project skills): commit only if collaborators should share them; `.claude/settings.local.json` is ignored.
- `.mcp.json` (21st.dev remote MCP; no key found in it) is ignored by default; commit if the team wants it.
- `supabase/ALL_MIGRATIONS.sql` duplicates migrations; keep in sync or drop.
