@AGENTS.md

# Absolute Cinema

Movie club web app with a Netflix-inspired UI: browse/write reviews, vote in polls, track a personal "Cinema Vault", view a screening calendar, and compete on a leaderboard. Full product spec lives in `ABSOLUTE_CINEMA_SPEC.md`.

## Current state (important)

The app is a **front-end prototype**. All UI is implemented in a single file, [src/App.tsx](src/App.tsx), with hardcoded mock data and no backend. There is no routing library, no state library, and no data fetching — navigation is a `useState<Page>` switch in the `App` root component.

The spec describes a full-stack build (Next.js + Supabase + React Query + Zod). **That is the long-term target, not what is implemented.** Do not follow the spec's Next.js/Supabase setup instructions against this repo. The repo is React + Vite + Tailwind CSS v4 (see `@AGENTS.md`). When the spec and the code disagree, the code is what exists.

## Architecture

- `App` in [src/App.tsx](src/App.tsx) holds page state (`home | calendar | leaderboard | profile`), dark-mode state, and a toast queue. Everything else is a local component in the same file.
- "Pages" are sections/components rendered by a switch in `App`: `HomePage`, `CalendarPage`, `LeaderboardPage`, `ProfilePage`.
- Reviews, polls, and library are not separate routes — they are `#reviews`, `#polls`, `#library` sections on the home page. The navbar smooth-scrolls to them.
- Mock data lives at the top of [src/App.tsx](src/App.tsx): `MOVIES`, `REVIEWS`, `REPLY_THREADS`, `POLLS`, `CALENDAR_EVENTS`, `LEADERBOARD`.

## Styling

- Dark mode is the default. Theme tokens are CSS variables on `:root`; the `.light` class on the root `<div>` swaps them (see [src/index.css](src/index.css)). Accent is a Netflix-red (`--accent: #ff1a44`).
- Use the existing CSS variables (`var(--background)`, `var(--card)`, `var(--accent)`, `var(--muted-foreground)`, etc.) rather than hardcoding colors. The component classes in App.tsx already follow this.
- Two fonts loaded in [src/index.css](src/index.css): `Outfit` (body, applied via `*`) and `Barlow Condensed` (display, via `.font-display`).
- `--star` is the gold used for ratings. `--radius` is the default border radius.
- A `btn-parallelogram` class in `index.css` gives buttons a slanted clip-path; reuse it for primary CTAs to match the existing look.

## Conventions

- Components are local functions with default export only on `App`. Keep new components in `App.tsx` unless the file is split out deliberately.
- All interactive bits (votes, polls, vault save, follow) are optimistic local state with a `push(text)` toast call — no persistence.

## RESPONSES
- give user advice on how to make better prompts to use less tokens and get better results