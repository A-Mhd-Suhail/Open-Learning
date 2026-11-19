# Open Learning – Production Audit Checklist
Legend: PASS / FAIL / FIXED AND RETESTED / NOT VERIFIED / BLOCKED / N/A. Env = local (built app, `next start`) unless noted.

| # | Area | Status | Env |
|---|------|--------|-----|
| 1 | Project/stack inspection, git state | PASS | local |
| 2 | Production URL identified | BLOCKED (not in repo, no `.vercel/`, no Vercel CLI) | – |
| 3 | tsc --noEmit | PASS | local |
| 4 | ESLint | PASS | local |
| 5 | Unit tests (vitest, 96) | PASS | local |
| 6 | SQL RLS suite (227 statements, multi-identity, incl. storage policies) | PASS | local throwaway Postgres + Supabase stub |
| 7 | `next build` | PASS | local |
| 8 | Secrets in source/tracked files | PASS (none found) | local |
| 9 | Secrets in git history (single commit) | PASS (none found) | local |
| 10 | Secrets in client bundle `.next/static` + `public/` | PASS (4 private values checked, 0 hits, 0 source maps) | local build |
| 11 | Private vars not `NEXT_PUBLIC_` | PASS (only SUPABASE URL/ANON key) | source |
| 12 | Unauthenticated API probes (token, import, template, cron, 404) | PASS | local |
| 13 | Origin/CSRF check on POST APIs | PASS | local |
| 14 | CORS preflight from foreign origin | PASS (no ACAO header) | local |
| 15 | Security headers | PARTIAL: HSTS added (FIXED, needs deploy), CSP absent (recommended) | local |
| 16 | npm audit | 2 moderate (uuid via exceljs) – not exploitable here, see report | local |
| 17 | Production website functional tests | BLOCKED | prod |
| 18 | Google OAuth flows, sessions, logout | NOT VERIFIED (needs real Google accounts) | – |
| 19 | Student ID / duplicate profile | PASS at DB level (SQL tests); NOT VERIFIED end-to-end | local |
| 20 | Live RLS against production Supabase | NOT VERIFIED (no test accounts, no prod access) | – |
| 21 | Video library click-through (2,584 rows) | NOT VERIFIED | – |
| 22 | Microphone / audio / WebRTC media | NOT VERIFIED (no devices, no LiveKit session) | – |
| 23 | Realtime chat multi-user, subscriptions cleanup | NOT VERIFIED | – |
| 24 | Image upload (type/size/private bucket) | PASS at policy/validator level; live upload NOT VERIFIED | local |
| 25 | Admin panel authorization | PASS (server 401/403 + RLS); live NOT VERIFIED | local |
| 26 | Performance (LCP/CLS/INP), load | NOT VERIFIED | – |
| 27 | Safari/Firefox/Edge, real mobile | NOT VERIFIED | – |

## Update 2 (production, open-learning-eta.vercel.app)
| Item | Status |
|---|---|
| Production URL identified | PASS (from Vercel screenshot) |
| Landing page in Chrome | PASS |
| Auth gate redirects, 404, API 401/403, cron 401 | PASS |
| Google sign-in | FAIL: redirect_uri_mismatch (Google Cloud OAuth client missing Supabase callback URI) |
| All signed-in features, two-account tests, production RLS | BLOCKED by sign-in failure |
| HSTS | PASS on production (Vercel default); local header FIXED AND RETESTED locally, not deployed |
| CSP report-only | Tested locally on public pages only; enforcement NOT recommended yet |
| npm audit uuid | NOT APPLICABLE (no buf usage) – reasoned from code, not an exploit test |
| Production headers after deploy | NOT VERIFIED (not deployed) |
