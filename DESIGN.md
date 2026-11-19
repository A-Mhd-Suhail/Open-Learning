---
name: Open Learning
---
# Design system

A study desk, not a SaaS template. Cool paper-grey ground, ink text, one deep-navy field for committed regions (sidebar, sign-up panel, closing band), and a flat highlighter yellow used the way a student uses a highlighter: once per view, on the one thing that matters. No gradients, glow, glass, tinted shadows or gradient text. Rejected by the user and banned: violet/pink gradients, glowing edges, identical card grids.

## Colour (tokens in src/app/globals.css)
- Light: background #f3f5f7, card #ffffff, ink #0c1a2b, muted text #4f5e6e, border #d5dbe3, primary navy #0f3d6e, band #0b2a4a, accent highlighter #ffd23f (text on it is ink).
- Dark: background #09121c, card #101c2a, text #e9eef4, border #223347, primary #7db2ec, band #0f2238.
- Status: success #1b7a47 / #5cc98a, destructive #b3261e / #f28b82.
- Strategy: restrained neutrals plus committed navy regions. Yellow only for: the `.mark` swipe behind one phrase or ID, the active sidebar item, and the single accent button on a navy band.

## Type
- Display: Bricolage Grotesque (h1, h2, row titles). Body/UI: Public Sans. IDs and code: system monospace with tabular numerals (`.num`).
- Display weight 600-650, tracking -0.022em, balanced wrapping. Body 16px / 1.55, measure under 75ch.

## Shape and depth
- Radius: 6px controls, 8px panels. Hairline 1px borders carry structure; there are no drop shadows.
- Lists are ruled rows (`RowList` / `RowLink`), not card grids. `PanelLink` is reserved for a two-way choice. Video cards are borderless: image, meta, title, one outlined action.

## Motion
- One authored moment: the landing library preview's rows settle in once (`.rise`, 0.7s, exponential ease-out). Hover uses 150-200ms colour and a 4px arrow shift. All motion is removed under prefers-reduced-motion.

## Components
Button (primary, secondary, ghost, accent), RowLink, RowList, PanelLink, PageHeader, StudentCard (the Student ID as a library card), AuthShell (navy explainer panel plus calm form), AppShell (navy sidebar, yellow active item), VideoCard, Logo (open "O" plus highlighter bar).
