# Open Learning design system

Black, white and gold. Serious, quiet, typographic. Gold is foil: active state, one primary call to action per view, the Student ID, hairlines. Source of truth for tokens: `src/app/globals.css`.

## Colour (use tokens, never raw hex)
| Token (class) | Light | Dark | Use |
|---|---|---|---|
| `background` | #ffffff | #0a0a0a | page |
| `card` | #ffffff | #141414 | panels, cards |
| `foreground` | #0a0a0a | #f5f5f4 | text |
| `muted` / `muted-foreground` | #f3f3f2 / #595959 | #1c1c1c / #a3a3a3 | quiet fills, secondary text |
| `border` | #e4e4e2 | #2b2b2b | hairlines |
| `primary` / `on-primary` | #0a0a0a / white | gold / #0a0a0a | main button |
| `accent` / `on-accent` | #d4af37 / #0a0a0a | same | gold fills (active marker, accent button) |
| `gold` (text) | #7a5a0f | #d4af37 | gold text that passes AA |
| `band` / `on-band` / `band-muted` | #0a0a0a / white / #a8a8a8 | black | committed black regions (rail, tab bar, footer) |
| `destructive`, `success`, `ring` | | | status, focus |

`.band-surface` re-reads the tokens as the dark set, so any component works inside a black region.

## Type
Display: Bodoni Moda (headings, wordmark). Body: Manrope. Mono (IDs): `font-mono num`.
`.t-display` clamp 2.5-4.5rem; `.t-h1` 2-3rem; `.t-h2` 1.5-2rem; `.t-h3` 1.125-1.25rem; `.t-body` 1rem/1.6; `.t-small` 0.875rem; `.t-eyebrow` 0.75rem caps, tracked, gold text; `.t-measure` max 65ch. Headings balance-wrapped, tracking -0.02em.

## Spacing and layout
4px base. Section gap `.section-stack` (3rem, 4rem at lg) or `space-y-12 lg:space-y-16`. Card padding `p-5 sm:p-6`. Page container `max-w-6xl` (`.page-container`). Gutters 16 / 24 / 40px (base / sm / lg). Helpers: `.pb-safe`, `.pt-safe` for safe-area insets.

## Radius and elevation
`rounded-md` 6px controls; `rounded-lg` 10px cards and panels; pills (`rounded-full`) for badges and avatars only. Cards are flat with hairline borders. One shadow, `shadow-card` / `.shadow-float`, for floating layers only (dialogs, menus, sticky bars).

## Components
- Button (`ui/button`): variants primary, secondary, ghost, accent (gold; one per view, usually on black); sizes sm 40, md 44, lg 52px. `loading`/`loadingText` shows a spinner and blocks double submits. `SubmitButton` and `PendingButton` read form pending state.
- Inputs: 44px tall, 16px text below lg, hairline border, gold-brown focus ring.
- Cards: `bg-card border border-border rounded-lg`; no shadow.
- Badge: pill, tones neutral/primary/success/accent/danger.
- Avatar: initials on muted disc; optional remote image.
- EmptyState: dashed hairline panel, gold-ringed icon, title, description, action.
- Dialog: native `<dialog>`; bottom sheet under 640px, centred card above; `shadow-card`.
- Skeleton: `.ol-skeleton` soft sweep, static under `prefers-reduced-motion`; always give final dimensions.

## Navigation shell
- lg+ (1024): fixed right panel 272px, black band, gold left bar + filled tile on the active item (`aria-current="page"`), groups: primary nav, Jump to (current path), footer with student card (copyable Student ID), theme toggle, sign out. Content column has `lg:pr-[272px]`, never squeezed.
- below lg: sticky 56px header (wordmark + avatar opening the account sheet) and fixed 64px bottom tab bar (Home, Learn, Language, Profile; Admin sits in the account sheet). Safe-area insets respected; content is padded so the bar never covers it.
- Page chrome: `PageHeader` renders BackButton + breadcrumbs (from sm) + eyebrow + h1 + description + actions. `BackButton` uses `router.back()` only when `NavTracker` (sessionStorage trail) shows the previous page is in-app, differs from the current page and is not its child; otherwise it links to the fallback (`backHref`, last linked crumb, or /dashboard). Hidden on /dashboard.

## Icons
Lucide, 16 (inline), 18 (nav rows), 22 (tab bar), stroke 1.75, `aria-hidden` when next to text.

## Breakpoints
Mobile-first: phone <640, `sm` 640, `md` 768, `lg` 1024 (rail), `xl` 1280.

## Interaction states
Hover: colour only. Focus: 2px `ring` outline, 2px offset (gold on black); `.focus-ring` for custom controls. Pressed: `.ol-pressable` scale .98. Disabled: 50% opacity, not-allowed. Loading: spinner + label change, `aria-busy`. Motion 150-200ms colour/transform; all removed under `prefers-reduced-motion`. Touch targets at least 44px.
