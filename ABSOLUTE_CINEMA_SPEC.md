# Absolute Cinema — Project Specification

Movie club web app. Netflix-inspired UI, dark/light mode, community features: reviews, polls, screenings, rankings.

---

## 1. Overview

**Absolute Cinema** = social platform for private movie club. Members watch films, write reviews, vote in polls, track watched/planned films, attend screenings, compete on leaderboard. Visual design borrows Netflix: bold cinematic typography, dark backgrounds, large poster imagery, smooth hover.

### Core goals

- One place to browse, write, discuss reviews.
- Admins run polls to pick next watch.
- Searchable library: genre, year, rating, watched-status filters.
- Screening calendar with event cards.
- Leaderboard ranks members by activity.
- Personal "Cinema Vault": watched, planned, favorited.

### Design principles

- **Cinematic**: bold sans-serif headers, large imagery, high contrast in dark mode.
- **Netflix-like**: hero banners, horizontal scroll rows, hover-scaled cards.
- **Responsive**: mobile single column → tablet 2 columns → desktop grid + carousels.
- **Smooth motion**: fade, slide, scale transitions on hover and page change.
- **Two themes**: dark (default) and light; respect preference, persist choice.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js (App Router) | Server components for library pages, client components for interactivity. |
| UI | React 19 | Component-driven. |
| Styling | Tailwind CSS | Utility classes; theme tokens via CSS variables. |
| Database | Supabase (PostgreSQL) | Auth, realtime votes, RLS. |
| Storage | Supabase Storage | Posters, avatars. |
| Auth | Supabase Auth | Email + OAuth (Google). `role` column: `member` / `admin`. |
| State | React Query (TanStack Query) | Server state, caching, optimistic votes. |
| Forms | React Hook Form + Zod | Review/poll submission validation. |
| Charts | Recharts or CSS bars | Poll progress bars (CSS preferred). |
| Calendar | React Day Picker or FullCalendar | Monthly view. |
| Deploy | Vercel | Edge-friendly, paired with Supabase. |
| Icons | Lucide React | Consistent icon set. |

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # server only, never exposed to client
```

---

## 3. Data Model (Supabase Tables)

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | References `auth.users.id`. |
| `username` | text | Unique display name. |
| `avatar_url` | text | Supabase Storage path. |
| `role` | text | `member` or `admin`, default `member`. |
| `created_at` | timestamptz | |

### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key. |
| `author_id` | uuid | References `profiles.id`. |
| `movie_id` | text | External movie ID (e.g. TMDb) or internal. |
| `title` | text | Denormalized for fast render. |
| `poster_url` | text | Poster image URL. |
| `rating` | int | Star rating 1–10. |
| `body` | text | Review content. |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `review_votes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `review_id` | uuid | References `reviews.id`. |
| `user_id` | uuid | References `profiles.id`. |
| `direction` | int | `1` upvote, `-1` downvote. |
| Unique `(review_id, user_id)` | | One vote per user per review. |

### `comments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `review_id` | uuid | References `reviews.id`. |
| `author_id` | uuid | |
| `parent_id` | uuid | Nullable; enables reply threads. |
| `body` | text | |
| `created_at` | timestamptz | |

### `polls`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `title` | text | e.g. "What should we watch next?" |
| `description` | text | |
| `created_by` | uuid | Admin. |
| `expires_at` | timestamptz | Closes after this date. |
| `status` | text | `open` or `closed`. |
| `created_at` | timestamptz | |

### `poll_options`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `poll_id` | uuid | References `polls.id`. |
| `movie_id` | text | |
| `title` | text | Option label. |
| `poster_url` | text | Optional option poster. |

### `poll_votes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `poll_id` | uuid | |
| `option_id` | uuid | |
| `user_id` | uuid | |
| Unique `(poll_id, user_id)` | | One vote per user per poll. |

### `screenings`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `movie_id` | text | |
| `title` | text | |
| `poster_url` | text | |
| `date` | date | Screening date. |
| `time` | time | Start time. |
| `location` | text | Venue or "Streaming". |
| `notes` | text | Optional description. |
| `created_by` | uuid | |

### `library_entries` (per-user watch state)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | |
| `user_id` | uuid | |
| `movie_id` | text | |
| `title` | text | |
| `poster_url` | text | |
| `status` | text | `watched`, `plan_to_watch`, `favorite`. |
| `rating` | int | Nullable, user's 1–10 rating. |
| `created_at` | timestamptz | |

### Row-Level Security (RLS) summary

- `profiles`: public read, owner write.
- `reviews`, `comments`: public read, owner write/delete.
- `review_votes`, `poll_votes`: owner insert/update/delete, public read of aggregates.
- `polls`, `poll_options`, `screenings`: public read, admin write.
- `library_entries`: owner-only read and write.

---

## 4. Global Layout & Navigation

### 4.1 Top Navigation Bar

**Left:** `Absolute Cinema` logo (text lockup + film/clapperboard icon).

**Center/right links (in order):** Home, Reviews, Polls, Library, Calendar, Leaderboard, Profile, Sign In.

Behavior:

- Desktop: horizontal links. Mobile: hamburger menu.
- Active route highlighted (underline or accent color).
- `Sign In` becomes avatar dropdown after login: username, theme toggle, Sign Out.
- Nav translucent with backdrop blur, solid on scroll (Netflix-style).

### 4.2 Theme Toggle

- Sun/moon icon button in nav.
- Persists to `localStorage`, applies `dark` class to `<html>`.
- Defaults to `prefers-color-scheme` if no saved choice.
- Theme tokens as CSS variables (background, surface, text, accent) so both themes share one Tailwind config.

### 4.3 Responsive breakpoints

- Mobile `< 640px`: single column, hamburger nav.
- Tablet `640–1024px`: 2-column grid, inline nav.
- Desktop `> 1024px`: multi-column grid, horizontal carousels.

---

## 5. Page-by-Page Breakdown

### 5.1 Home

**Purpose:** landing page, featured content + recent activity.

1. **Hero banner** — large featured review: backdrop, title, star rating, short excerpt, "Read Review" CTA. Auto-rotates or user swipes.
2. **Latest Reviews** — horizontal scroll row (poster + title + rating).
3. **Movie Polls** — current open poll with live progress bar + "Vote", or most recent if none open.
4. **Upcoming Screenings** — next 3–5 as compact event cards (date, title, location, time).

### 5.2 Reviews

**Purpose:** browse all reviews, submit new.

- **Header:** title + "Write a Review" button.
- **Filter/sort bar:** newest, top-rated, most upvoted.
- **Review cards:** poster, title, 1–10 rating, author, date, body, upvote/downvote + net score, expandable reply thread.

Card details:

- **Rating (1–10):** 10 star icons filled proportionally, or numeric badge `8/10`.
- **Votes:** two buttons, live counts, current-user state highlighted, optimistic update.
- **Reply thread:** comments nested by `parent_id`; "Reply" opens inline composer; collapsed after 3 replies.

**Submit modal/page:**

- Search/select movie (poster preview).
- Star rating picker (1–10).
- Body textarea, validated.
- Submit inserts `reviews` row; appears at top.

### 5.3 Polls

**Purpose:** admins create, members vote.

- **Active poll cards:** title, description, option list.
- **Each option:** label + poster thumbnail, vote count, progress bar (share of total).
- **Expiration:** "Closes in 3 days" or "Closed". Closed = read-only, winner highlighted.
- **Voting:** one click casts/changes vote (optimistic, realtime via Supabase subscriptions).

**Admin controls:**

- "New Poll" button (admin only).
- Form: title, description, 2–8 options with optional posters, expiration datetime.
- Close or delete a poll.

### 5.4 Movie Library

**Purpose:** searchable catalog with filters + personal watch state.

- **Search bar:** debounced text input, filters by title.
- **Filters:** genre (multi-select), year (range/dropdown), rating (minimum), watched status (`all`, `watched`, `plan to watch`, `favorite`).
- **Results grid:** poster cards (poster, title, year, genre, user's rating if set).
- **Hover:** card scales, reveals quick actions (mark watched, add to plan, star).

Data source: static seed list, TMDb API (needs key), or Supabase `movies` table. Recommend TMDb + Supabase cache.

### 5.5 Calendar

**Purpose:** screening dates in monthly calendar + event cards.

- **Monthly view:** highlights days with screenings; click day filters event list.
- **Event cards:** poster, title, date, time, location. Optional "Attend"/RSVP (needs `rsvps` table).
- **Upcoming list:** chronological, beside/below calendar.
- **Admin:** add/edit/delete screening events.

### 5.6 Leaderboard

**Purpose:** rank members by contribution.

Two tabs/columns:

1. **Most Reviews Written** — by count of `reviews`.
2. **Most Upvotes Received** — by sum of net upvotes across member's reviews.

Each row: rank, avatar, username, metric. Top 3 emphasized (gold/silver/bronze badge or accent ring).

### 5.7 Profile

**Purpose:** personal page + social hub.

1. **Header:** avatar, username, member-since, total reviews, total upvotes.
2. **Friends:** search members, add (needs `friendships`: `requester_id`, `addressee_id`, `status`).
3. **Cinema Vault:** tabbed — **Watched**, **Plan to Watch**, **Favorites (starred)**.
4. **Ratings & Reviews grid:** user's own reviews (poster, title, rating, snippet), link to full.

---

## 6. Component Inventory

| Component | Description | Reused On |
|-----------|-------------|-----------|
| `Navbar` | Top nav, logo, links, theme toggle, auth dropdown | All pages |
| `ThemeToggle` | Sun/moon button, persists theme | Navbar |
| `HeroBanner` | Featured review backdrop carousel | Home |
| `ReviewCard` | Poster, title, rating, votes, reply thread | Home, Reviews, Profile |
| `StarRating` | 1–10 display + input | ReviewCard, ReviewForm, Library |
| `VoteButtons` | Upvote/downvote, optimistic | ReviewCard |
| `CommentThread` | Nested replies, inline composer | ReviewCard |
| `ReviewForm` | Modal/page to submit | Reviews |
| `PollCard` | Options, bars, vote button, expiry | Home, Polls |
| `PollOption` | Single option, bar + count | PollCard |
| `PollForm` | Admin poll creation | Polls |
| `SearchBar` | Debounced search | Library, Friends |
| `FilterGroup` | Genre/year/rating/status filters | Library |
| `MovieCard` | Poster card, hover actions | Library, Vault |
| `CalendarView` | Monthly grid, highlighted days | Calendar |
| `ScreeningCard` | Event card | Calendar, Home |
| `LeaderboardTable` | Ranked list, top-3 emphasis | Leaderboard |
| `VaultTabs` | Watched / Plan / Favorites tabs | Profile |
| `FriendSearch` | Search + add friends | Profile |
| `AuthModal` | Sign in / sign up | Navbar |

---

## 7. Feature Roadmap

### Phase 1 — MVP

- Scaffold (Next.js + Tailwind + Supabase).
- Theme toggle.
- Navbar + routing.
- Auth: sign in, sign up, sign out.
- Reviews: browse, write, rating, votes, reply threads.
- Home: hero, latest reviews, polls, upcoming screenings.
- Polls: admin create, member vote, bars, expiry.
- Basic leaderboard (reviews written, upvotes received).

### Phase 2 — Library & Calendar

- Library: search + genre/year/rating/status filters.
- Per-user watch state.
- Cinema Vault tabs on Profile.
- Calendar: monthly view + event cards.
- Admin screening management.

### Phase 3 — Social & Polish

- Friends search + lists.
- Realtime (Supabase subscriptions): votes, comments, poll bars.
- Notifications (optional `notifications` table).
- Hero auto-rotation + transitions.
- Profile stats.
- Accessibility pass (keyboard nav, ARIA, focus states).

### Phase 4 — Scale & Extras

- TMDb integration.
- Infinite scroll / pagination on Reviews + Library.
- Search-as-you-type suggestions.
- RSVP / attendance tracking.
- Admin dashboard (moderation).
- Performance: `next/image`, caching, code splitting.

---

## 8. Acceptance Criteria (summary)

- Theme toggle persists, applies globally.
- Members write, vote, reply to reviews.
- Admins create polls; members vote; bars update live.
- Library filters combine, show watch state.
- Calendar shows monthly view + screening cards.
- Leaderboard ranks by both metrics.
- Profile shows Vault tabs + ratings grid.
- All pages responsive.

---

## 9. NEXT STEPS

### 9.0 Status (updated 2026-09-14)

**Stack.** React 19 + Vite 8 + Tailwind CSS v4. Supabase client-side via `@supabase/supabase-js`, `@tanstack/react-query` for server state. No Next.js — `CLAUDE.md` pins repo to Vite.

**Live & deployed.** Production Supabase project, `schema.sql` run, seeded (1186 movies, demo users, reviews, polls, screenings). Vercel: `https://absolutecinema-rust.vercel.app`. `src/lib/` facade falls back to `localStorage` mock when `.env` absent.

**Done.**
- Auth: email/password (sign-up restricted to `@tsinglan.org`) + Google; session-driven navbar + sign-in modal.
- Admin console gated by club code (not role): correct code unlocks console, promotes signed-in user to `admin` so admin writes pass RLS.
- Featured reviews: admins toggle; hero carousel shows featured only (falls back to newest 3).
- Edit profile: change username + upload avatar.
- Realtime: `postgres_changes` subscriptions invalidate review-vote / comment / poll-vote caches.
- Validation: zod schemas in `src/lib/validation.ts`.
- Notifications: `notifications` table + triggers + UI.
- Storage: poster + avatar uploads to Supabase Storage.
- Reviews, polls, vault, following, screenings, leaderboard read/write through facade — live, mock otherwise.

**Not yet done.**
- TMDb integration — catalog is static seed (1186 movies), no live import.
- Accessibility pass.

### 9.1 Remaining code (ordered)

1. TMDb: add catalog import (TMDb key) or keep seed — decide before launch.
2. Accessibility: keyboard nav, ARIA labels, focus states; confirm responsiveness.

### 9.2 Additional updates / features / adjustments

- Change "club rankings" in leaderboards to "school rankings".
-
