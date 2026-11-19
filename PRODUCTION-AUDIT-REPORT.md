# Open Learning – Production Audit Report

Date: 2026-11-19. Repo: `main`, one commit (`92bbda0`). Stack: Next.js 16.4.6 (App Router, proxy.ts gate), Supabase (Postgres/RLS/Storage/Realtime, Google OAuth), LiveKit (token route), Vercel (cron only in `vercel.json`).

## A. Overall status
**Not production-verified.** The deployed site could not be tested: the production URL is not in the repo (no `.vercel/`, no Vercel CLI, git remote is GitHub only), and I had no Google test accounts or Supabase/LiveKit dashboard access. Everything below marked "local" ran against the built app on localhost or a throwaway local Postgres. Nothing here proves the deployed environment matches.

- Security (code/design): **good** – no confirmed vulnerabilities found in what was inspected.
- Reliability: build, types, lint, 96 unit tests, SQL RLS suite all pass.
- Functional (live): **NOT VERIFIED**.
- Performance: **NOT VERIFIED**.

## B. Tests actually run
| Test | Env | Result | Evidence |
|---|---|---|---|
| tsc --noEmit | local | PASS | exit 0 (re-run after my change) |
| eslint | local | PASS | no output |
| vitest | local | PASS | 8 files, 96 tests |
| SQL RLS suite `supabase/tests/run-local.sh` | local Postgres + stub | PASS | `ALL_SQL_TESTS_PASSED` (role/student_id/email immutability, group/message/voice access, friends, language profiles, posts/likes/comments, storage.objects policies, import_reports) |
| next build | local | PASS | all routes compile |
| Client bundle secret scan | local build | PASS | service-role key, LiveKit key+secret, Google SA private key: 0 occurrences in `.next/static` and `public/`; 0 source maps |
| Git tracked files / history secret patterns | local | PASS | only `.env.example` tracked; no JWT/key/PEM patterns in history |
| `/dashboard`,`/learn/school`,`/admin` unauthenticated | local | PASS | 307 redirect |
| `/nope` | local | PASS | 404 |
| POST `/api/livekit-token` without Origin | local | PASS | 403 |
| same, with Origin, no session | local | PASS | 401 |
| POST `/api/admin/videos/import`, GET `/template` unauth | local | PASS | 401 |
| `/api/cron/purge-stories` wrong bearer | local | PASS | 401 (constant-time compare) |
| CORS preflight foreign origin | local | PASS | no Access-Control headers |
| npm audit | local | 2 moderate | `uuid` <11.1.1 via `exceljs`; bounds check only when a caller supplies `buf` to v3/v5/v6. Dev-style import tool, not a confirmed exploit. `npm audit fix --force` would downgrade exceljs (breaking) – not applied. |

## C. Security findings
1. **MEDIUM → FIXED (needs deploy): no HSTS header** in `next.config.ts`. Added `Strict-Transport-Security: max-age=63072000; includeSubDomains` ([next.config.ts](next.config.ts)). Vercel adds HSTS on its own domains, but custom domains benefit from the explicit header. Retest: tsc passes; header not yet re-curled on a build (not re-run after the edit).
2. **LOW – no Content-Security-Policy.** Recommend `Content-Security-Policy-Report-Only` first, allowing Supabase (https/wss), LiveKit (wss), Google OAuth, YouTube thumbnails (`i.ytimg.com`), before enforcing. Not added: an untested CSP risks breaking OAuth/voice.
3. **LOW – `livekit-token` rooms use token TTL 1h**, identity = user id (not spoofable; derived server-side), `canPublishData:false`. A removed member keeps a valid token up to 1h. Consider shorter TTL (e.g. 15 min) with refresh.
4. **INFO – `uuid` advisory via exceljs** (see above).
5. **INFO – no rate limiting** on API routes or RPCs (token mint, post/comment creation). Supabase/Vercel provide only coarse protection; add limits before heavy traffic.
6. **INFO – `.env.local` contains real secrets on disk**; it is git-ignored and was never committed. No rotation needed based on repo evidence. I cannot verify what is set in Vercel.

Design strengths observed: column-level grants on `profiles`, guard trigger blocking role/student_id/email edits, `SECURITY DEFINER` functions use `set search_path = ''`, service-role client is `server-only` and used only in admin client/callback/cron, private `community-media` bucket with owner-folder policies and size/MIME limits, admin routes check role server-side plus RLS `is_admin()`, token route checks membership and capacity in DB before minting.

## D. API and credential audit
- Secrets in source: none found. In git history: none found (pattern scan; one commit). In frontend bundles: none. Private key exposed: no evidence. Rotation needed: none from evidence found; rotate if you ever shared `.env.local`.
- Vercel configuration: **only `vercel.json` inspected**; env vars/dashboard NOT VERIFIED.
- Endpoint inventory: `/api/livekit-token` (authenticated, origin-checked), `/api/admin/videos/{import,preview,template}` (admin), `/api/cron/purge-stories` (service, bearer secret). Server actions and page-level data access rely on RLS.

## E. Feature results
Google auth, Student ID end-to-end, dashboard, School/JEE/NEET UI, video library clicks, Language Learning, voice rooms, microphone, audio playback, LiveKit media, chat/realtime, community posts, image uploads, likes/comments, friends, admin panel UI, mobile responsiveness: **NOT VERIFIED live**. DB-level rules for student ID, profiles, rooms, chat, voice capacity, friends, posts, likes, comments, storage, admin writes: **PASS** in the local SQL suite. Video data: 2,584 rows are direct watch links per the earlier work; site-side clicking not done.

## F. Remaining risks / unverified
Everything marked NOT VERIFIED/BLOCKED in the checklist: production reachability and headers, OAuth redirect URLs, live RLS with two real accounts, WebRTC media (mic permission states, remote audio, reconnect, track cleanup), realtime subscription cleanup, upload behavior, load/performance, Safari/Firefox/mobile, MFA (none implemented).

## G. Deployment instructions
- Code change: `next.config.ts` (HSTS header). Needs a new Vercel deployment. No SQL migration. No env var change.
- Env vars needing attention by name only: `CRON_SECRET` (confirm set in Vercel Production), `SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_SECRET`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (confirm none are `NEXT_PUBLIC_`). Rotation: none required by findings.
- To finish the audit I need: the production URL, two Google test accounts (or confirmation I may use the signed-in Chrome session), and approval before any write to production.


---
# Update 2 – production run (https://open-learning-eta.vercel.app, 2026-11-19)

## Headline: Google sign-in is FAILING on production (HIGH, blocks everything authenticated)
Clicked "Continue with Google" in Chrome: Google shows **"Access blocked: This app's request is invalid – Error 400: redirect_uri_mismatch"**.
Root cause (verified): the app's Supabase project redirects Google to `https://<project-ref>.supabase.co/auth/v1/callback` (ref `supfvejihyhspuuvtrlk`, a public value; checked with the Supabase authorize endpoint). That exact URI is not listed under **Authorized redirect URIs** on the Google OAuth client used by Supabase. Nothing in the app code causes this.
Fix (manual, yours): Google Cloud Console → APIs & Services → Credentials → the OAuth client entered in Supabase → add `https://supfvejihyhspuuvtrlk.supabase.co/auth/v1/callback`. Also confirm Supabase → Authentication → URL Configuration has Site URL `https://open-learning-eta.vercel.app` and Redirect URL `https://open-learning-eta.vercel.app/auth/callback`, and that the Client ID/Secret in Supabase's Google provider belong to the same Google client. Not changed by me.

Consequence: no student can sign in, so chat groups, voice rooms, dashboard, uploads, likes/comments and admin cannot be reached on production. That is why those features "don't work" right now; the authenticated code was not reached.

## Production results
| Test | Result | Evidence |
|---|---|---|
| Landing page loads | PASS | Chrome: renders, 0 broken images, no horizontal overflow, 0 console errors |
| Nav links | PASS (hrefs inspected; not all clicked) | `/onboarding`, in-page anchors |
| /dashboard, /admin unauthenticated | PASS | 307 to `/onboarding` |
| Invalid route | PASS | 404 |
| Google sign-in | **FAIL** | redirect_uri_mismatch (above) |
| Student ID generation, returning login, session, logout | BLOCKED by sign-in | – |
| Dashboard, School/JEE/NEET, video library, Language Learning, chat, voice, mic, audio, LiveKit, uploads, likes, comments, friends | BLOCKED | need a signed-in session |
| Two-account communication, cross-user isolation on production | BLOCKED (only the local SQL suite covers it) | – |
| Admin access | BLOCKED; unauth API returns 401 | curl |
| POST `/api/livekit-token` no Origin / no session | PASS | 403 / 401 |
| Cron route wrong bearer | PASS | 401 |
| Admin template route unauthenticated | PASS | 401 |
| CORS preflight foreign origin on API | PASS | no ACAO header |
| Source map guess | PASS | 403 |
| Production response headers | PASS for X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy; HSTS present | curl -I |

## HSTS (correction to my earlier finding)
Production already sends `strict-transport-security: max-age=63072000; includeSubDomains; preload` (Vercel adds it on its domains), so the earlier "no HSTS" finding is **not a production issue** on `*.vercel.app`. My explicit header in `next.config.ts` is harmless, tested locally (`next build` + `next start`, header present), and only matters for a custom domain. Not yet deployed; status: tested locally, not verified on production after deploy. Do not add `preload` yourself unless you intend to submit a custom domain to the preload list.

## CSP report-only
Added `Content-Security-Policy-Report-Only` in `next.config.ts` (allows Supabase https/wss, LiveKit cloud wss, YouTube frames/thumbnails, Google avatars; `form-action` deliberately omitted so the OAuth redirect cannot be blocked later). Tested locally: header served; loading `/` and `/onboarding` in Chrome produced no console CSP reports. **Limitation:** signed-in pages, LiveKit connection and uploads were not exercised, and the LiveKit host is a guess (`*.livekit.cloud`). Do not enforce until production console shows no reports after real use. Needs a Vercel deployment.

## npm audit (uuid via exceljs) – resolved as not applicable
Installed `uuid@8.3.2`; `exceljs@4.4.0` calls only `uuid.v4()` with no buffer argument (single call site, `cf-rule-ext-xform.js`). The advisory concerns v3/v5/v6 with a caller-supplied `buf`. Not exploitable here; no upgrade or downgrade performed (the suggested `--force` fix would install an older exceljs). Re-check when exceljs releases a fix.

## What you must do manually
1. Fix the Google redirect URI (above). Then tell me, and I will rerun the sign-in, ID, chat, voice and isolation tests.
2. Two Google test accounts are needed for two-account tests. Your Chrome is signed in as one account; a second (separate Chrome profile/incognito window) is required. I will not use or ask for passwords.
3. Voice/mic tests need real audio hardware in the browser; mark NOT VERIFIED until run.
4. Deploy (commit and push `main`) to ship the HSTS/CSP-report-only change; then I re-curl production headers.

---
# Update 3 – signed-in production run (open-learning-eta.vercel.app, 2026-11-19)
Account used (you approved): the secondary Google account, an existing student "TJM", `OL-2026-000002`. A real friend ("Najiba") exists on this account; I did not interact with them.

| Test | Result | Evidence |
|---|---|---|
| Google sign-in after your Google Cloud fix | **FIXED AND RETESTED – PASS** | account chooser → `/dashboard` |
| Returning login keeps Student ID, no re-onboarding | PASS | went straight to dashboard, ID unchanged |
| New-student onboarding (name after Google) | NOT VERIFIED (only existing accounts available) | – |
| Dashboard, 5 categories, Programming & AI "Coming soon" | PASS | screenshot/text |
| Video library (School) | PASS | 1,834 videos; 72/72 YouTube links on page are direct `watch?v=` (0 search/playlist/channel) |
| Library filters | PASS (Tamil + Class 10 = 122 of 1,834; Clear filters shown) | other filters/sort/JEE/NEET tabs not each clicked |
| Language setup (target, level, 2 known languages, discoverable) | PASS but slow (~10 s) | profile saved, overview shows Tamil / English, Hindi |
| Create private chat room | PASS but slow (~10–15 s) | room page, owner listed |
| Send messages | PASS | plain + Tamil/Hindi/Japanese/emoji; `<b>x</b>` shown as text (no HTML injection); persists after reload; input max 2000; empty send disabled |
| Create private voice room | PASS (slow) | room page |
| LiveKit token (own room) | PASS | 200; 1h TTL; canPublishData=false; identity is user UUID; room-scoped; host is `wss://*.livekit.cloud`; no secret in response |
| Token negative tests | PASS | random group 404; chat room as voice 404; bad/empty body 400; random call 403 |
| Create post, like, comment, delete own post | PASS (delete UI took ~6 s to refresh) | post gone after reload |
| Microphone / join voice / audio playback / reconnect / track cleanup | NOT VERIFIED: mic permission is "prompt"; granting it is your decision. 1 input + 1 output device exist | – |
| Two-account chat / realtime / cross-user isolation on production | NOT VERIFIED: needs a second account | – |
| Image upload (post/story) | NOT VERIFIED on production (policy/validator covered locally) | – |
| Admin panel | NOT VERIFIED (account is not admin; not promoting anyone) | – |
| Direct Supabase API attack tests (role escalation, student_id edit, anon reads) with session token | BLOCKED: auto-mode classifier denied reading the session cookie to call the REST API; not worked around. Covered only by local SQL RLS suite | – |

## New findings
- **MEDIUM – slow writes:** language profile save, room creation and post delete each took ~6–15 s. Likely Supabase region far from Vercel's `bom1` function region (or RPC cold starts). Check both regions; consider moving the Supabase project or Vercel function region together.
- **LOW:** three stale PKCE `code-verifier` cookies remained after failed/old sign-in attempts (cosmetic). Auth cookie is JS-readable (default `@supabase/ssr`; acceptable but means XSS would expose the session – another reason to add CSP).
- **INFO:** nav highlights "Friends" while inside a chat/voice room page.
- Test data left on production (private): chat room "ZZ audit test room", voice room "ZZ audit voice", 2 messages, plus the saved language profile (Tamil; English, Hindi). The test post/comment/like were deleted. Delete the two rooms when done.
- CSP LiveKit host guess (`*.livekit.cloud`) is confirmed correct.

---
# Update 4 – two-account production run (2026-11-19)
Accounts: A = "TJM" `OL-2026-000002` (student, secondary Google account). B = "Najiba" `OL-2026-000001` (**Administrator**, your main account). Only 2 students exist on production (admin panel count). B is an admin, so it is not a plain-student stand-in; a third non-admin account is needed for a strict student-vs-student isolation test.

| Test | Result | Evidence |
|---|---|---|
| Logout, then room URL while signed out | PASS | redirected to `/onboarding` |
| Sign in with 2nd Google account | PASS | lands on dashboard, correct ID/role |
| Non-member (B, admin) opening A's private chat room | PASS | only "Join this room to take part"; no messages shown |
| Join private room via invite link | PASS | B appears as member (2) |
| Cross-account message delivery (A→B history, B→A reply) | PASS (persisted delivery; reload-based) | B saw A's 2 messages; A saw B's reply after reload |
| Live realtime push between two simultaneous browsers | NOT VERIFIED (one browser, one session at a time) | – |
| Admin panel as admin | PASS | Videos 2,584 · Students 2 · Groups 26 |
| `/admin` as student | PASS | 404 page |
| `/api/admin/videos/{template,import,preview}` as student | PASS | 403 / 403 / 403 |
| Logout works | PASS | – |
Remaining NOT VERIFIED: microphone/join voice/audio/reconnect, image upload, admin video import with a real file (not run to avoid writing to the library), new-student onboarding, strict student-to-student isolation, direct Supabase API attack tests (blocked by the safety classifier).
Test data still on production: private chat room "ZZ audit test room" (now 2 members, 3 messages), private voice room "ZZ audit voice". Account B joined the chat room as a member; delete both rooms when done.

---
# Update 5 – microphone / LiveKit on production (2026-11-19, Chrome, account A)
| Test | Result | Evidence |
|---|---|---|
| Mic capture (getUserMedia) after your permission | PASS | track `live`, stopped immediately |
| Audio devices present | PASS | 1 input, 1 output |
| LiveKit token for own voice room | PASS | HTTP 200, 1 h TTL, room-scoped, no publishData |
| LiveKit signalling WebSocket | PASS | `wss://…livekit.cloud/rtc/v1` connected, server v1.13.11, region India South |
| Media (peer connection) first attempt | **FAIL** | console: "ConnectionError: could not establish pc connection" |
| Media after automatic region-fallback retry | PASS (but slow) | UI "Connected · 1 in room"; reproduced twice, ~35–45 s each time to connect |
| Mute / unmute | PASS | button toggles Mute↔Unmute |
| Leave room | PASS in UI ("Not connected") | – |
| Participant count after leaving or closing the tab | PASS but delayed | still "1 live" right after; "0 live" after ~90 s (stale-heartbeat window) |
| Remote participant audio playback, multi-participant, device switch/disconnect, mic permission revoked mid-call, network drop reconnect, echo | NOT VERIFIED (single browser; no second audio session; no hardware changes) | – |
| STUN/UDP reachability from this browser | PASS (srflx/udp candidates gathered) | – |

## New finding – VOICE CONNECT DELAY (HIGH for usability)
Students joining a voice room wait ~35–45 s on "Connecting… Joining…" because the first WebRTC connection attempt fails and only the retry succeeds. Signalling, token and mic are fine, and UDP to STUN works, so the app code and token are not the cause. Likely causes, not confirmed: media ports/TURN fallback blocked or slow on this network/ISP, or LiveKit project media settings. Next steps for you: (1) try the same join from a phone hotspot or another network; (2) open the LiveKit Cloud dashboard → Sessions/Logs and look for ICE/transport errors for these attempts; (3) tell me the result. If the delay is network-specific it is not an app bug, but a TURN/TCP fallback tuning (e.g. fewer region retries, showing "still connecting" help text and a retry button) would improve the experience.

---
# Update 6 – why the site feels slow, voice delay, mobile (2026-11-19)
## Measured causes of slowness
| # | Problem | Evidence | Fix | Status |
|---|---|---|---|---|
| 1 | **Vercel functions run in Washington DC (`iad1`)**, users are in India (edge `bom1`), database appears to be in Tokyo. Every dynamic page/API call crosses the world 2–3 times | response header `x-vercel-id: bom1::iad1::…` on `/api/livekit-token`; DB host IPv6 prefix geolocates to Tokyo, REST→DB ≈ +0.1–0.5 s over gateway from India | `vercel.json` → `"regions": ["hnd1"]` (Tokyo, next to the database) | CODE CHANGED, needs deploy + confirm Supabase region |
| 2 | **Many database round trips in a row per page.** Each request did: verify user (network) → then load profile → then page queries; each trip is ~170 ms+ from `iad1` to Tokyo | `src/lib/auth.ts` | `getSession` now reads user id from signed claims locally and loads the profile in parallel with the server-side user check (still verified, one trip saved on every request) | CHANGED, tsc/lint/96 tests/build pass; not measured on production |
| 3 | **Join voice does 5+ serial database calls inside the token route** (session ×2, group, membership, `voice_join`) and only starts after the mic step | `src/app/api/livekit-token/route.ts`, `VoiceRoom.tsx` | group + membership lookups now parallel; token request now runs while the browser asks for the mic; `prepareConnection` pre-opens the media server link | CHANGED, not measured on production |
| 4 | **No loading feedback** on most pages (only chat had a skeleton), so a tap looks dead until server data returns | only one `loading.tsx` existed | added `src/app/(app)/loading.tsx` skeleton for every signed-in page | CHANGED |
| 5 | **Writes (save profile, create room, delete post) took 6–15 s** | measured earlier on production | same root causes as 1–2 (several serial calls × ocean-length hops); `revalidatePath` calls also re-render pages after each write | EXPECTED to improve after region move; not verified |
| 6 | Supabase region may itself be far from your students | inferred | **Manual**: Supabase → Project Settings → region. Best: a region in India (Mumbai `ap-south-1`) with Vercel `bom1`. Moving a project means creating a new one and restoring data; I did not do this | NOT DONE (your decision) |

## Voice delay 2–3 s – causes
Normal LiveKit audio latency is ~0.1–0.4 s, so 2–3 s means something is adding buffering. Most likely, in order:
1. **Media is being relayed over TCP/TURN** instead of direct UDP. Evidence: the first connection attempt fails ("could not establish pc connection") and only a fallback works after ~40 s. TCP relays add retransmission delay and a bigger playout buffer. This depends on the network (ISP/Wi-Fi/VPN/firewall blocking UDP), not on the website code. Test: another network or phone hotspot.
2. **Bluetooth headphones/earbuds** add 0.2–1 s on their own; a laptop speaker with the mic open also causes echo cancellation lag.
3. Slow/weak device or Wi-Fi congestion.
What I changed in code: voice-tuned encoding (`AudioPresets.speech`, DTX, RED redundancy), echo cancellation/noise suppression/auto gain on, earlier media-server connection, parallel join steps. Cannot be fully "fixed" in code if the network blocks UDP; check LiveKit Cloud logs for ICE/TURN usage.

## Mobile
- Audited: landing page at 375 px (PASS: no overflow, hamburger menu, large tap targets). Signed-in layouts reviewed in code: already use dynamic viewport units, safe-area insets, 44 px targets, bottom-sheet dialogs, scrollable tab bar, 16 px inputs. Signed-in pages could not be framed for emulation (`X-Frame-Options: DENY`, intentional) and the Chrome window cannot go below ~1200 px, so signed-in mobile screens are NOT VERIFIED visually.
- Fixed: on iPhone/Android browsers audio playback is often blocked after the join delay; a "Tap to turn on sound" button now appears when the browser blocks remote audio.
- Biggest mobile gain is the same latency work above (mobile networks suffer most from many serial round trips).

## Verification state
tsc PASS, eslint PASS, vitest 96/96 PASS, `next build` PASS after these edits. Production speed/voice behaviour after the change: NOT VERIFIED until deployed.
