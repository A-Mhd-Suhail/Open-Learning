# Open Learning — Implementation Log

Last updated: 2026-11-18 (after Phase 5/6 work). Statuses are **verified** (a test/run proved it), **built, unverified** (code exists, not run end-to-end), or **not started**.

## Environment / working rules
- Only working directory: `/Users/suhail/Desktop/Open-Learning`. Test DB lives in `.local-db/` (gitignored, local Postgres on localhost:54329, stub Supabase schema, no real data/credentials).
- No Supabase / Google / LiveKit credentials exist in the project yet → anything needing them is *unverified*.

## Checks that pass today
| Check | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm run lint` | pass (0 errors, 0 warnings) |
| `npm run build` (Next 16, Cache Components) | pass |
| `npx vitest run` (13 tests: YouTube URL parsing, row validation, duplicates, filters, Sheet URL allow-list, xlsx template round-trip + upload rejection) | pass |
| `bash supabase/tests/run-local.sh` (migrations 0001–0004 + RLS/ID/authorization tests, 40-way concurrent signup checked manually: 40 unique IDs) | pass |
| Browser: landing page, onboarding step 1 validation, name cookie → step 2, protected route redirect | pass |

## Phase 1 — Foundation + landing: COMPLETED (verified)
Landing (nav, hero, how-it-works, categories, study-together, footer), design tokens (`design-system/open-learning/`), Plus Jakarta Sans, light tokens + dark token set (dark theme toggle not wired).

## Phase 2 — Auth, Student ID, dashboard: BUILT; DB layer verified; live flow UNVERIFIED
- Verified: year-wise atomic Student ID (`next_student_id`, `student_id_counters`, UNIQUE), role/student_id/email immutable for students (grants + trigger + RLS), onboarding name steps.
- Unverified (needs Supabase project + Google OAuth): Google sign-in, `/auth/callback`, session persistence, dashboard/profile rendering against real data, sign-out.
- Known gaps: no `next=` redirect plumbing for invite links yet; dark-mode toggle absent.

## Phase 3 — Category routes: BUILT; runtime UNVERIFIED
`/learn`, `/learn/[category]` (single gate in layout; coming-soon categories not enterable), self-learning hub, Papers/Tests designed placeholders. Needs login to exercise.

## Phase 4 — Video library + import: BUILT; logic unit-tested; runtime UNVERIFIED
Unit-tested: validation, duplicates, filters, xlsx template, upload rejection, Sheet URL allow-list. Unverified: admin pages, `/api/admin/videos/*` with a real admin session, real Google Sheets fetch (needs service account or API key and the sheet link), student library UI.

## Phase 5 — Learn With Friends: BUILT; DB layer verified; runtime UNVERIFIED (needs Supabase/LiveKit)
- Routes: `friends` hub; `friends/{discussion,chat,voice}` → `create`, `mine`, `general`, `[groupId]`; `friends/join/[code]` (invite); `friends/my-friends` (+ `[studentId]` profile, study-together invite); `friends/call/[callId]`; `friends/games` (all "in development", nothing playable).
- Chat/discussion: Supabase Realtime subscription + insert under RLS, history with "load earlier". Voice/call: LiveKit via `livekit-client`; mic-permission and connection states; token from `/api/livekit-token`, which checks membership (group) or participant+freshness (call). Call button only shown when LiveKit is configured.
- Verified: migrations/RPC/RLS (SQL suite incl. study-together), unauthenticated `/api/livekit-token` → 403, admin template → 401, route compiles/builds.
- UNVERIFIED: actual realtime delivery, actual audio between two browsers, incoming-call banner, invite flow, friend request UI.

## Phase 6 — Hardening, polish, docs: PARTIALLY DONE
Done: security headers, 404/error pages, README with setup steps, `.env.example` + empty `.env.local`, graceful handling of missing credentials (verified in browser: sign-in click shows a notice; protected pages redirect; voice/call/Sheets show "not configured"), mobile 375px landing has no horizontal overflow.
Not done: dark-mode toggle (tokens exist); responsive/a11y sweep of authenticated pages (cannot render without login); Playwright e2e; admin/library runtime tests.

## Pending / needs the user
Fill `.env.local` (see README), apply migrations 0001–0004 to Supabase, enable Google provider, set first admin via SQL, share the Google Sheet (service account or link-viewable). Then I can run the end-to-end verification.

## Update — UI polish (after credentials were announced)
- Verified at this point: `.env.local` still had EMPTY values (file unchanged since creation), so no live verification could be run.
- Added: pointer-following spotlight on all feature cards (pattern from 21st.dev "Spotlight Card", implemented locally, no install), arrow/icon micro-motion, hero float, refined scroll-reveal (reduced-motion safe), dark-mode toggle (landing + app sidebar, persisted, no flash). Dark landing verified in browser.
- Added `supabase/ALL_MIGRATIONS.sql` (migrations 0001–0004 concatenated) for one-paste setup in the Supabase SQL editor.

## Update — 2026-11-18 evening (credentials now present)
- Verified: `.env.local` now has Supabase, LiveKit and Google service-account values (Google OAuth client id/secret and Sheets API key still empty; OAuth is configured in Supabase itself). Service-role REST probe shows migrations applied, `groups` seeded, 1 profile (`OL-2026-000001`), `videos` empty.
- Verified: tsc, lint, vitest (13), `npm run build` pass; dev server on :3000 redirects protected routes to `/onboarding` when signed out.
- Fixed (unverified live): dev log showed "unstable `Date.now()` while prerendering" on `/dashboard`, `/learn`, `/profile` for signed-in users. Added `await connection()` in `getSession` (`src/lib/auth.ts`). Needs a signed-in browser check to confirm the error is gone.
- (Earlier note that `ALL_MIGRATIONS.sql` lacked 0005 was wrong; it is included.)
- Still not exercised: admin video import (needs the Sheet link), realtime chat, LiveKit audio between two browsers.

## Update — live signed-in check (Claude in Chrome, localhost:3000)
- Verified: signed in as a real Google user (`OL-2026-000002`); `/dashboard`, `/learn`, `/learn/school`, `/profile` render correct data; protected-route redirect works when signed out.
- Open (dev-only diagnostics, pages still work): Next 16 "instant navigation" validation errors in the browser console — `connection()` outside Suspense in `requireSession` (dashboard/profile) and `params` outside Suspense (`/learn/[category]`). The `connection()` in `getSession` changed the message from `Date.now()` to this one; a `(app)/loading.tsx` did not clear it (reverted). Fix options: per-page Suspense around the session read, or `export const instant = false` on these routes.

## Update — console errors fixed (verified in Chrome, signed in)
- Fix: `await connection()` in `getSession` (clears the `Date.now()` prerender error) + `experimental.instantInsights.validationLevel: "manual-warning"` in `next.config.ts` (every app route reads the session, so automatic instant-navigation validation was just noise; segments can still opt in via `export const instant`).
- Verified: `/dashboard`, `/profile`, `/learn/school`, `/learn/school/friends/my-friends` load with zero console errors; lint + 13 tests pass.

## Update — Google Sheet import adapted to the real sheet (verified read-only)
- Sheet (tabs `School`, `Jee & Neet`; columns language, channel, board, class, subject, chapter, title, year, link_type, link_label, link_url) is readable by the service account. Its links are YouTube *search* pages, not videos.
- Importer now: accepts `https://www.youtube.com/results?search_query=…` links (`isYoutubeSearchUrl`/`isYoutubeLink`); maps `title`→Video Title, `link_url`→YouTube Link, `channel`/`board`; derives Exam from the tab name (`examFromTab`; ambiguous names like "Jee & Neet" need an Exam column), a stable hashed Video ID, a "Channel · BOARD" description, capitalised subject; accepts year ranges (`2024-2025` → 2024). The xlsx template path is unchanged and still strict.
- `VideoCard` shows "Find on YouTube" for search links.
- Verified: tsc, lint, 16 tests (3 new); live dry run of tab 1 → 402/402 valid, 0 issues, 0 duplicate IDs (Chemistry 105 / Math 159 / Biology 138; classes 9–12).
- NOT done: the actual write to the `videos` table (needs an admin account). Tab 2 "Jee & Neet" appears to be a copy of tab 1 (same rows, all CBSE classes 9–12); importer reads only the first tab.

## Update — videos imported (verified)
- `OL-2026-000001` promoted to `admin` (service-role PATCH). Imported 402 videos from the School tab (402 created, 0 updated, 0 skipped); `import_reports` row written; `videos` table = 402.
- The write used the same validate/upsert logic as `/api/admin/videos/import` but via the service-role key, because the Chrome session is signed in as `OL-2026-000002` (student). The admin UI/route itself (session + same-origin + RLS path) is still untested end to end.
- Verified as a student: `/learn/school/self-learning/videos` shows 24 cards per page with a "Show more" button, class/subject/chapter/topic/year/language filters and sort; cards link to YouTube search in a new tab (`rel="noopener noreferrer"`); no console errors.

## Update — account renumbering (done at the user's request)
- Deleted the old demo account (`suhailnit2026@gmail.com`, was OL-2026-000001; no dependent data). Renumbered via service role (the immutability trigger exempts it): Najiba `amhdsuhail2007@gmail.com` → OL-2026-000001 and made **admin**; Demoo `amhdsuhail2026@gmail.com` → OL-2026-000002 (student). `student_id_counters(2026).last_value` = 2, so the next signup gets 000003. Videos table untouched (402).
- Student IDs are meant to be permanent; this was a one-off manual correction.

## Update — admin import verified end to end (signed in as OL-2026-000001, admin)
- Verified in Chrome: `/admin` (Videos 402 · Students 2 · Groups 27), `/admin/videos`; Google Sheet preview → "402 rows · 0 new · 402 updates · 0 invalid"; "Import valid rows" → "Import complete: 402 rows · 0 created · 402 updated · 0 skipped"; videos count stays 402; no console errors.
- Bug found: the UI import did not save an `import_reports` row (admins had only SELECT, no INSERT policy; the route ignored the error). Fixed in `supabase/migrations/0006_import_reports_insert.sql` (also appended to `ALL_MIGRATIONS.sql`), route now logs the failure, RLS test added (local suite passes). **0006 is NOT yet applied to the live Supabase project** — run it in the SQL editor.

## Update — migration 0006 applied and verified
- After the user ran 0006 in the Supabase SQL editor, an admin-UI re-import saved an `import_reports` row (402 total, 0 created, 402 updated, 0 skipped, `admin_id` = OL-2026-000001). The admin import flow is now verified end to end, including the audit trail.
- The first report (from the direct service-role import) has `admin_id` null because that admin account was later deleted.
- Remaining unverified: realtime chat/discussion delivery, LiveKit audio between two browsers, invite links, friend requests UI, incoming-call banner, admin Students/Groups pages, per-video edit/delete, xlsx upload through the UI.

## Update — second-session setup for two-user tests
- `next.config.ts`: `allowedDevOrigins: ["127.0.0.1"]` (dev only). Without it the page on `http://127.0.0.1:3000` did not hydrate and the onboarding form fell back to a native GET (`/onboarding?name=`). Verified hydrated afterwards. `localhost:3000` and `127.0.0.1:3000` hold separate cookies, so two accounts can be signed in at once in one Chrome profile. Supabase redirect URLs must include `http://127.0.0.1:3000/**`.

## Update — two-user tests (Chrome: localhost = OL-2026-000001 admin, 127.0.0.1 = OL-2026-000002 student)
- VERIFIED: student search by Student ID; friend request delivered to the other account; accept → both sides list each other as friends; join public chat room; **realtime chat delivered both directions without reload** (sender name + timestamp shown, "Live" indicator, no console errors).
- Minor UX gap: after sending a friend request the sender's button still says "Add friend" (no "Request sent" state) until a reload.
- NOT WORKING / UNDIAGNOSED: starting a call creates the `friend_calls` row (`status = ringing`) and the caller lands on the call page ("Not connected / Join voice"), but the callee's incoming-call banner (`IncomingCalls.tsx`, Realtime INSERT on `friend_calls`) did not appear in two attempts, although `friend_calls` is in the publication in migration 0002 and chat uses the same mechanism. Next check: in the Supabase SQL editor run `select tablename from pg_publication_tables where pubname = 'supabase_realtime';` — expect messages, friend_calls, voice_participants.
- NOT TESTED: LiveKit audio (needs the browser microphone prompt), discussion posts, invite links, admin Students/Groups pages, video edit/delete, xlsx upload via UI.

## Update — incoming-call banner fixed (verified, two accounts)
- Root cause (found with temporary logging, since removed): `IncomingCalls` subscribes as soon as the page layout mounts, before the browser Supabase client has passed the user's JWT to Realtime, so RLS was evaluated as `anon` and every event arrived as `errors: ["Error 401: Unauthorized"]` with an empty `new` record (and the `callee_id` filter therefore never matched). The publication was fine (`messages`, `voice_participants`, `friend_calls` confirmed in `pg_publication_tables`).
- Fix: `src/app/(app)/learn/[category]/friends/IncomingCalls.tsx` now awaits `auth.getSession()` and calls `realtime.setAuth(access_token)` before subscribing (server-side `callee_id` filter kept).
- Verified: placing a call from OL-2026-000001 shows "Najiba is calling you" with accept/decline on OL-2026-000002; accepting sets `friend_calls.status = accepted` and opens the call page; no console errors. LiveKit audio itself ("Join voice") still untested (browser microphone prompt).
- `npm run lint` now reports 93 warnings, all from `.claude/skills/impeccable/scripts/live-browser.js` (a skill folder added to the project, not app code); fixed by adding `.claude/**` to the ESLint ignores (lint is back to 0 warnings).

## Update — UI redesign (replaces the original indigo/orange look)
- Trigger: the first design was judged generic. Rebuilt with the impeccable, ui-ux-pro-max and 21st skills as a restrained "study desk" system: paper-grey ground, ink text, deep-navy regions, one flat highlighter yellow. No gradients, glow, glass or tinted shadows. Details in `DESIGN.md`; strategy in `PRODUCT.md` and `.impeccable/surfaces/src-app-page-tsx.md`. `design-system/open-learning/MASTER.md` (indigo/orange, Plus Jakarta Sans) is SUPERSEDED by `DESIGN.md`.
- Changed: tokens and fonts (Bricolage Grotesque + Public Sans); Button, Logo, PageHeader, AppShell (navy sidebar), new RowLink/RowList/PanelLink, StudentCard, AuthShell, LibraryPreview; landing, onboarding, dashboard, learn, self-learning, friends hub, group list, admin home, video card, profile, error and 404. Removed unused Spotlight, FeatureCard, Reveal, HeroIllustration. Radii/weights normalised across all other pages (groups, chat, voice, admin tables, forms).
- Verified: `tsc`, `eslint`, `next build` pass; Impeccable detector reports 0 findings on `src/` and on the rendered `/` and `/onboarding`; landing and onboarding checked in the browser (light, dark, desktop; no horizontal overflow at 375px on the portal shell); a console error (`new Date()` during prerender in AuthShell) was found and fixed.
- NOT verified visually while signed in: videos library with real data, profile, group/chat/voice pages, friends pages, admin tables and importer. They inherit the new tokens/radii but were not screenshotted. The Impeccable finish-reviewer subagent was not run, and the concept roll was skipped because the brief pinned the direction.

## Update — direct YouTube links in the workbook
- Cards/thumbnail/title/button all use `watchUrlFor()` (canonical watch URL, new tab).
- Resolved the 402 search links in the School tab to top YouTube results (scripts + progress in `.work/`), validated chapter words and class against the video title, and wrote `Open-Learning-Videos.xlsx` (381 replaced, 21 left as search links; see `docs/video-link-resolution-report.json`). Untouched export: `Open-Learning-Videos.original.xlsx`. The Google Sheet was not modified.

## Direct YouTube links only

Import now rejects YouTube search/results, playlist and channel URLs ("YouTube link must be a direct video URL"). watch/youtu.be/embed/shorts/live URLs are normalised to https://www.youtube.com/watch?v=ID on import. watchUrlFor returns null for non-video URLs; VideoCard no longer has a "Find on YouTube" branch.

## Video library at scale (6 languages, School/JEE/NEET)
- Loading: `src/lib/videos/load.ts` pages through `.range()` (1000/page, order `created_at desc, id`, first page also returns the exact count, the rest are fetched in parallel) instead of `.limit(5000)`, which PostgREST silently caps at 1000. Only the needed columns are selected. Filtering stays client-side (a few thousand rows is cheap); 24 per page + "Show more" kept.
- Filters (`src/lib/videos/filter.ts`, `VideoLibrary.tsx`): classes sort numerically, languages in a fixed order (English, Tamil, Hindi, Malayalam, Telugu, Kannada), years newest first; search is multi-word, case-insensitive and covers title/subject/chapter/topic/description (channel, board)/language; `changeFilter` resets any dependent filter (e.g. chapter/topic after the subject changes) that no longer exists; the Class filter is hidden when there is only one class value (JEE/NEET); "Clear filters" shows whenever any filter or search is active; count shows "X of Y videos"; sorting has a unique-id tiebreaker.
- JEE/NEET: both are in `ACTIVE_CATEGORIES`, so `/learn/jee|neet/self-learning/videos` use the same page (subject options come from the data: Physics/Chemistry/Mathematics, Physics/Chemistry/Biology).
- Import: the 11-column workbook (language, channel, board, class, subject, chapter, title, year, link_type, link_label, link_url) is accepted by both xlsx upload (auto-detected when there is no Video ID/Exam column) and the Google-Sheet path via `src/lib/videos/derive.ts`: Exam from class (JEE/NEET) else tab else School; Subject normalised (math/maths → Mathematics, Title Case); "Chapter | Topic" split; Description "Channel · BOARD"; Video ID `yt-<11-char id>`; year "2025-2026" → 2025. Legacy 12-column template unchanged. Upload limits raised to 10 MB / 10,000 rows.
- Tests: `tests/video-library.test.ts` (filters, cascade/reset, paging loader with a fake client, new import format).

## Update — Language Learning community (migration 0008)
- Added: language onboarding/preferences/dashboard, language voice + chat rooms (reusing groups tables), community feed/likes/comments/stories, private `community-media` bucket, cron purge route, SQL + unit tests.
- Live-tested with two accounts: onboarding, rooms, realtime chat both ways, post with images, like, comment, story, edit, delete (storage cleanup), preferences, anon access blocked, voice token (member OK / non-member 403).
- Bugs found live and fixed: profile save used upsert (needs UPDATE on user_id → failed; now update-then-insert); Avatar passed an event handler from a server component (now a client component); wizard Continue auto-submitted step 3 (button keys); leaving a language room redirected to the old list.
- Not verified: real voice audio (browser mic prompt), widths below ~500px, capacity with 3 live users, Vercel deploy, GitHub push (no repo).
