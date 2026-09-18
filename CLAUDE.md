@AGENTS.md

# Absolute Cinema

Movie club web app with a Netflix-inspired UI. Full spec in `ABSOLUTE_CINEMA_SPEC.md`.

## Current state

**Front-end prototype only.** All UI lives in one file, [src/App.tsx](src/App.tsx), with hardcoded mock data and no backend. No routing/state/data libraries — navigation is a `useState<Page>` switch in `App`.

The spec targets a full-stack build (Next.js + Supabase + React Query + Zod). **That is not implemented.** The repo is React + Vite + Tailwind CSS v4. When spec and code disagree, code wins.

## Architecture

- `App` in [src/App.tsx](src/App.tsx) holds page state (`home | calendar | leaderboard | profile`), dark-mode state, and a toast queue. Everything else is a local component in the same file.
- "Pages" render via a switch in `App`: `HomePage`, `CalendarPage`, `LeaderboardPage`, `ProfilePage`.
- Reviews/polls/library are `#reviews`, `#polls`, `#library` sections on the home page; the navbar smooth-scrolls to them.
- Mock data at top of [src/App.tsx](src/App.tsx): `MOVIES`, `REVIEWS`, `REPLY_THREADS`, `POLLS`, `CALENDAR_EVENTS`, `LEADERBOARD`.

## Styling

- Dark mode default. Theme tokens are CSS variables on `:root`; `.light` on the root `<div>` swaps them (see [src/index.css](src/index.css)). Accent is `--accent: #ff1a44`.
- Use CSS variables (`var(--background)`, `var(--card)`, `var(--accent)`, `var(--muted-foreground)`, etc.) instead of hardcoding colors.
- Fonts in [src/index.css](src/index.css): `Outfit` (body) and `Barlow Condensed` (`.font-display`).
- `--star` = rating gold. `--radius` = default border radius. `btn-parallelogram` class = slanted primary CTAs.

## Conventions

- Local function components; default export only on `App`. Keep new components in `App.tsx` unless split deliberately.
- Interactive state (votes, polls, vault save, follow) is optimistic local state with a `push(text)` toast — no persistence.

## RESPONSES
- Give user advice on making better prompts: fewer tokens, better results.
