---
name: Open Learning
---
# Design system

Black, white and gold. A serious, typographic learning platform: white paper in light mode, black in dark mode, committed black regions (navigation rail, tab bar, closing bands), and gold used as foil: the active state, one primary action per view, the Student ID and hairlines. No gradients, glow, glass or tinted shadows. Full written system: `docs/DESIGN_SYSTEM.md`.

## Colour (tokens in src/app/globals.css)
- Light: background #ffffff, ink #0a0a0a, muted text #595959, border #e4e4e2, primary black, gold fill #d4af37, gold text #7a5a0f (AA).
- Dark: background #0a0a0a, card #141414, text #f5f5f4, border #2b2b2b, primary gold.
- Band (rail, tab bar): always black, text white, muted #a8a8a8. Status: success #1b7a47 / #5cc98a, destructive #b3261e / #f28b82.

## Type
Display Bodoni Moda, body Manrope, mono for IDs. Scale classes `.t-display .t-h1 .t-h2 .t-h3 .t-body .t-small .t-eyebrow`.

## Shape and depth
Radius 6px controls, 10px cards. Flat cards with hairline borders; one soft shadow (`shadow-card`) only for floating layers.

## Navigation
Desktop: fixed 272px RIGHT-hand panel (black, gold active bar), content column never squeezed. Mobile: compact header, bottom tab bar (Home, Learn, Language, Profile), account sheet. Every inner page opens with Back + breadcrumb (`PageHeader`).

## Motion
150-200ms colour and transform; skeleton sweep; all removed under prefers-reduced-motion.

## Components
Button, RowLink, RowList, PanelLink, PageHeader, BackButton, Breadcrumbs, StudentCard, AuthShell, AppShell (RightRail, MobileHeader, MobileTabBar, AccountMenu), VideoCard, Badge, Avatar, EmptyState, Dialog, Skeleton, Logo (open gold "O" on a black tile).
