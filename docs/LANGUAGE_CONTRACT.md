# Language Learning community — shared contract (read before editing)

Owner of this file + migration 0008 + `src/lib/categories.ts`, `src/lib/groups.ts`, `src/lib/language/{languages,types}.ts`: the lead. **Do not edit those**; ask via your final report.
Stack notes: Next.js 16 (read `node_modules/next/dist/docs/` for anything unfamiliar — Cache Components + `proxy.ts`, `connection()` in `getSession`). Server components fetch with `requireSession()` (`@/lib/auth`) which returns `{ supabase, user, profile }` (RLS client for the signed-in user). Client components use `createClient()` from `@/lib/supabase/client`. Never use the service role in user paths. Never print secrets from `.env.local`.
Design: existing tokens in `src/app/globals.css` (Tailwind v4 `@theme`, colours like `bg-card text-muted-foreground border-border bg-primary text-on-primary bg-band text-on-band bg-accent`, `font-display`). One design system only. Read `DESIGN.md`, `PRODUCT.md`, `design-system/`. No emoji icons (lucide-react), 44px touch targets, 16px inputs on mobile, visible focus, `motion-reduce`, no horizontal scroll at 320px.
Do not break existing features. No git repo exists; do not run git. Keep all files inside /Users/suhail/Desktop/Open-Learning. Temporary files go in `.work/` only.

## Routes (category slug is `languages`; all under the existing `src/app/(app)/learn/[category]/`)
| Route | Owner |
|---|---|
| `/learn/languages` dashboard (`[category]/page.tsx` branches: exam categories keep the existing panels) | A1 |
| `/learn/languages/setup` onboarding (3 steps) and `/learn/languages/preferences` (edit later) | A1 |
| `/learn/languages/voice` Voice Rooms list+create | A2 (uses A3's `RoomBrowser`) |
| `/learn/languages/chat` Chat Rooms list+create | A3 |
| `/learn/languages/community` feed + stories (+ `/community/new`, `/community/[postId]`) | A4 |
| Existing `/learn/[category]/friends/**` (my friends, groups, call, discussion) is REUSED. Room detail for language rooms is the existing `/learn/languages/friends/[kind]/[groupId]` (owner: A2, handles voice AND chat rendering) | A2 |
| Sub-navigation shown for languages in `[category]/layout.tsx` | A5 |
Language gate rule: a signed-in student without a `language_profiles` row who opens any language route other than `/setup` is redirected to `/learn/languages/setup` (helper `requireLanguageProfile()` in `src/lib/language/profile.ts`, owned by A1; others call it at the top of their pages).

## Database (migration 0008, already written; apply order is fixed)
- `language_profiles(user_id pk, target_language, known_languages[], proficiency, discoverable, created_at, updated_at)` — RLS: read own or discoverable; insert/update own.
- Rooms REUSE `groups/group_members/messages/voice_participants` with `category='languages'`, `language`, `max_participants` (voice only). RPCs: `create_language_room(p_type 'chat'|'voice', p_name, p_language, p_description, p_visibility, p_max)`, `language_rooms(p_type, p_language)` (listing with creator, member_count, live_count, is_member), existing `join_group(p_group)` (public rooms), `join_group_by_invite`, `voice_join(p_group)` (now capacity-aware; raises `room is full` SQLSTATE 53400; also the 30s heartbeat — a participant unseen for 90s stops counting), `voice_leave`.
- Posts: `posts, post_images(path), post_likes(pk post_id+user_id), post_comments, stories(expires_at ≤ 24h)`. RPCs: `create_post(p_body,p_visibility 'public'|'friends',p_language,p_paths[])` (images must already be uploaded to `<uid>/<file>`), `update_post(p_id,p_body,p_visibility)`, `community_feed(p_before,p_limit,p_language,p_author)` (SECURITY INVOKER), `create_story(p_path,p_caption)`, `purge_expired_stories()` (service role only; returns storage paths to delete). Likes/comments/deleting own posts/stories use plain table insert/delete under RLS.
- Storage: private bucket `community-media` (5 MB, jpeg/png/webp/gif). Upload path MUST be `<auth uid>/<uuid>.<ext>`. Display through signed URLs (`createSignedUrls`) generated with the user's own client.
- Types and constants: `src/lib/language/types.ts`, `languages.ts`.
- Stories expire by RLS immediately (`expires_at > now()`); file cleanup only happens when `/api/cron/purge-stories` runs (A4 builds it; A6 wires the schedule). Say this honestly in UI copy/docs; never claim automatic file deletion without it.

## Shared components (file ownership)
- A5 creates FIRST (within its first few steps) in `src/components/ui/`: `avatar.tsx` (`<Avatar name src size />`), `dialog.tsx` (`<Dialog open onClose title>` accessible modal that becomes a bottom sheet on mobile), `empty-state.tsx` (`<EmptyState icon title description action />`), `badge.tsx`, `skeleton.tsx`, `section-card.tsx`. Others should import these by exactly those paths and names; if a file does not exist yet when you need it, build your feature against the contract and re-check before finishing. A5 may restyle shared primitives but must keep their props stable.
- A3 owns `src/components/language/rooms/RoomBrowser.tsx` (async server component `<RoomBrowser category="languages" kind="chat"|"voice" />` listing public rooms with filter by language + `CreateRoomForm` dialog) and `RoomCard.tsx`; A2 consumes it for the voice page.
- A1 owns `src/components/language/dashboard/*` and `src/lib/language/profile.ts`.
- A4 owns `src/components/language/community/*`, `src/lib/language/media.ts`.
- A2 owns `src/components/app/VoiceRoom.tsx`, `src/app/api/livekit-token/route.ts`.
- A3 owns `src/components/app/ChatRoom.tsx` (keep the existing props contract — A2's page passes them).
- A6 owns `supabase/tests/*`, `tests/*` (new test files), `vercel.json`, `.env.example`, `.gitignore`, `docs/DEPLOYMENT.md`, `README.md`.
- Nobody else edits `src/app/globals.css`, `src/components/app/Sidebar.tsx`, marketing components (A5 only).
