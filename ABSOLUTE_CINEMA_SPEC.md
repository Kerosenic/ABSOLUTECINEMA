# Absolute Cinema — Project Specification

A comprehensive specification for **Absolute Cinema**, a movie club website with a Netflix-inspired UI, dark/light mode toggle, and community features for reviewing, polling, screening, and ranking films.

---

## 1. Overview

**Absolute Cinema** is a social platform for a private movie club. Members watch films together, write reviews, vote in polls, track what they have watched or plan to watch, attend screenings, and compete on a leaderboard. The visual design borrows from Netflix: bold cinematic typography, dark backgrounds, large poster imagery, and smooth hover animations.

### Core goals

- Give members one place to browse, write, and discuss movie reviews.
- Let admins run movie polls to decide what the club watches next.
- Provide a searchable movie library with genre, year, rating, and watched-status filters.
- Show upcoming screenings on a calendar with event cards.
- Rank members by activity to encourage participation.
- Let each member build a personal "Cinema Vault" of watched, planned, and favorited films.

### Design principles

- **Cinematic**: bold sans-serif headers, large imagery, high contrast in dark mode.
- **Netflix-like**: hero banners, horizontal scroll rows, hover-scaled cards.
- **Responsive**: layouts adapt from mobile (single column) to tablet (2 columns) to desktop (multi-column grid and horizontal carousels).
- **Smooth motion**: subtle fade, slide, and scale transitions on hover and page change.
- **Two themes**: dark mode (default, Netflix-style) and light mode, both respecting user preference and persisting the choice.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js (App Router) | Server components for library pages, client components for interactive features. |
| UI | React 19 | Component-driven, client interactivity where needed. |
| Styling | Tailwind CSS | Utility classes; theme tokens via CSS variables for dark/light switch. |
| Database | Supabase (PostgreSQL) | Auth, realtime votes, row-level security. |
| Storage | Supabase Storage | Movie posters and user avatars. |
| Auth | Supabase Auth | Email + OAuth (Google). Role column for `member` vs `admin`. |
| State | React Query (TanStack Query) | Server state, caching, optimistic updates for votes. |
| Forms | React Hook Form + Zod | Review and poll submission with validation. |
| Charts | Recharts or CSS bars | Progress bars for polls (CSS preferred for simplicity). |
| Calendar | React Day Picker or FullCalendar | Monthly calendar view. |
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
| `username` | text | Unique, display name. |
| `avatar_url` | text | Supabase Storage path. |
| `role` | text | `member` or `admin`, default `member`. |
| `created_at` | timestamptz | |

### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key. |
| `author_id` | uuid | References `profiles.id`. |
| `movie_id` | text | External movie ID (e.g. TMDb) or internal id. |
| `title` | text | Movie title (denormalized for fast render). |
| `poster_url` | text | Poster image URL. |
| `rating` | int | Star rating, 1–10. |
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
| Unique constraint on `(review_id, user_id)` | | One vote per user per review. |

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
| `created_by` | uuid | Admin who created it. |
| `expires_at` | timestamptz | Poll closes after this date. |
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
| Unique constraint on `(poll_id, user_id)` | | One vote per user per poll. |

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
| `rating` | int | Nullable, user's own 1–10 rating. |
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

**Left:** `Absolute Cinema` logo (text lockup with a film/clapperboard icon).

**Center/right links (in order):**
Home, Reviews, Polls, Library, Calendar, Leaderboard, Profile, Sign In.

Behavior:

- On desktop, horizontal links. On mobile, collapse into a hamburger menu.
- Active route is highlighted (underline or accent color).
- `Sign In` becomes a user avatar dropdown after login, showing username, theme toggle, and Sign Out.
- Nav background is translucent with backdrop blur, solid on scroll (Netflix-style).

### 4.2 Theme Toggle

- A sun/moon icon button in the nav.
- Persists choice to `localStorage` and applies a `dark` class to `<html>`.
- Defaults to `prefers-color-scheme` if no saved choice.
- Theme tokens defined as CSS variables (background, surface, text, accent) so both themes share one Tailwind config.

### 4.3 Responsive breakpoints

- Mobile: `< 640px` — single column, hamburger nav.
- Tablet: `640–1024px` — 2-column grid, inline nav.
- Desktop: `> 1024px` — multi-column grid, horizontal carousels.

---

## 5. Page-by-Page Breakdown

### 5.1 Home

**Purpose:** Landing page that highlights featured content and recent activity.

Sections:

1. **Hero banner** — large featured review. Shows movie backdrop image, title, star rating, a short review excerpt, and a "Read Review" call-to-action. Auto-rotates through a small set of featured reviews, or lets the user swipe between them.
2. **Latest Reviews** — horizontal scroll row of the newest reviews (poster + title + rating).
3. **Movie Polls** — the current open poll with a live progress bar and a "Vote" button, or the most recent poll if none open.
4. **Upcoming Screenings** — the next 3–5 screenings as compact event cards (date, title, location, time).

### 5.2 Reviews

**Purpose:** Browse all reviews and submit new ones.

Layout:

- **Header:** page title + "Write a Review" button.
- **Filter/sort bar:** sort by newest, top-rated, or most upvoted.
- **Review cards:** each shows poster, title, 1–10 star rating, author, date, body text, upvote/downvote buttons with net score, and an expandable reply thread.

Review card details:

- **Star rating (1–10):** rendered as 10 star icons, filled proportionally, or a numeric badge like `8/10`.
- **Upvote/downvote:** two buttons with live counts; vote state highlighted for the current user; optimistic update on click.
- **Reply thread:** comments nested by `parent_id`. "Reply" button opens an inline composer. Collapsed by default after 3 replies.

**Submit new review modal/page:**

- Search/select a movie (poster preview).
- Star rating picker (1–10).
- Body textarea with validation.
- Submit inserts a `reviews` row; review appears at top of the list.

### 5.3 Polls

**Purpose:** Admins create polls; members vote.

Layout:

- **Active poll cards:** title, description, option list.
- **Each option:** label + poster thumbnail, current vote count, and a progress bar showing its share of the total.
- **Expiration:** shows "Closes in 3 days" or "Closed" state. Closed polls become read-only with the winner highlighted.
- **Voting:** one click on an option casts or changes the vote (optimistic, realtime via Supabase subscriptions so bars update live).

**Admin controls:**

- "New Poll" button (admin only).
- Form: title, description, 2–8 options with optional posters, expiration datetime.
- Close or delete a poll.

### 5.4 Movie Library

**Purpose:** Searchable catalog of movies with filters and personal watch state.

Layout:

- **Search bar:** text input, debounced, filters by title.
- **Filter controls:** genre (multi-select), year (range or dropdown), rating (minimum), watched status (`all`, `watched`, `plan to watch`, `favorite`).
- **Results grid:** poster cards. Each card shows poster, title, year, genre, and (if the user has rated it) their star rating.
- **Hover:** card scales up and reveals quick actions (mark watched, add to plan, star favorite).

Data source: either a static seed list, TMDb API (requires API key), or a Supabase `movies` table. Recommend TMDb for real data with a Supabase cache table.

### 5.5 Calendar

**Purpose:** Show screening dates in a monthly calendar and as event cards.

Layout:

- **Monthly calendar view:** highlights days with screenings. Clicking a day filters the event list below.
- **Event cards:** each shows movie poster, title, date, time, and location. An "Attend" or RSVP button (optional, requires a `rsvps` table).
- **Upcoming list:** chronological list of future screenings beside or below the calendar.
- **Admin:** add/edit/delete screening events.

### 5.6 Leaderboard

**Purpose:** Rank members by contribution.

Two tabs or columns:

1. **Most Reviews Written** — ranked list by count of `reviews` per member.
2. **Most Upvotes Received** — ranked list by sum of net upvotes across a member's reviews.

Each row: rank, avatar, username, metric value. Top 3 get visual emphasis (gold/silver/bronze badge or accent ring).

### 5.7 Profile

**Purpose:** Personal page and social hub.

Sections:

1. **Header:** avatar, username, member-since date, total reviews, total upvotes.
2. **Friends:** search for members by username and add as friends (requires `friendships` table: `requester_id`, `addressee_id`, `status`).
3. **Cinema Vault:** tabbed panel with three tabs:
   - **Watched** — grid of watched movies with the user's rating.
   - **Plan to Watch** — grid of planned movies.
   - **Favorites (starred)** — grid of starred movies.
4. **Ratings & Reviews grid:** a grid of the user's own reviews (poster, title, star rating, snippet), linking to the full review.

---

## 6. Component Inventory

| Component | Description | Reused On |
|-----------|-------------|-----------|
| `Navbar` | Top nav, logo, links, theme toggle, auth dropdown | All pages |
| `ThemeToggle` | Sun/moon button, persists theme | Navbar |
| `HeroBanner` | Featured review backdrop carousel | Home |
| `ReviewCard` | Poster, title, rating, votes, reply thread | Home, Reviews, Profile |
| `StarRating` | 1–10 star display and input | ReviewCard, ReviewForm, Library |
| `VoteButtons` | Upvote/downvote with optimistic update | ReviewCard |
| `CommentThread` | Nested replies with inline composer | ReviewCard |
| `ReviewForm` | Modal/page to submit a review | Reviews |
| `PollCard` | Options, progress bars, vote button, expiry | Home, Polls |
| `PollOption` | Single option with bar and count | PollCard |
| `PollForm` | Admin poll creation | Polls |
| `SearchBar` | Debounced text search | Library, Friends search |
| `FilterGroup` | Genre/year/rating/status filters | Library |
| `MovieCard` | Poster card with hover quick actions | Library, Vault |
| `CalendarView` | Monthly grid with highlighted days | Calendar |
| `ScreeningCard` | Event card: title, date, time, location | Calendar, Home |
| `LeaderboardTable` | Ranked list, top-3 emphasis | Leaderboard |
| `VaultTabs` | Watched / Plan to Watch / Favorites tabs | Profile |
| `FriendSearch` | Search and add friends | Profile |
| `AuthModal` | Sign in / sign up | Navbar |

---

## 7. Feature Roadmap

### Phase 1 — MVP

- Project scaffold (Next.js + Tailwind + Supabase).
- Theme toggle (dark/light).
- Navbar and page routing.
- Auth: sign in, sign up, sign out.
- Reviews: browse, write, star rating, upvote/downvote, reply threads.
- Home page with hero, latest reviews, polls, upcoming screenings.
- Polls: admin create, member vote, progress bars, expiry.
- Basic leaderboard (reviews written, upvotes received).

### Phase 2 — Library & Calendar

- Movie library with search + genre/year/rating/status filters.
- Per-user watch state (watched / plan to watch / favorite).
- Cinema Vault tabs on Profile.
- Calendar with monthly view and screening event cards.
- Admin screening management.

### Phase 3 — Social & Polish

- Friends search and friend lists.
- Realtime updates (Supabase subscriptions) for votes, comments, and poll bars.
- Notifications for replies and friend requests (optional `notifications` table).
- Hero banner auto-rotation and smooth transitions.
- Profile stats: total reviews, total upvotes.
- Accessibility pass (keyboard nav, ARIA labels, focus states).

### Phase 4 — Scale & Extras

- TMDb integration for real movie metadata and posters.
- Infinite scroll / pagination on Reviews and Library.
- Search-as-you-type suggestions.
- RSVP and attendance tracking for screenings.
- Admin dashboard for moderation.
- Performance: image optimization via `next/image`, caching, code splitting.

---

## 8. Acceptance Criteria (summary)

- Theme toggle persists and applies globally.
- Members can write, vote on, and reply to reviews.
- Admins can create polls; members can vote; bars update live.
- Library filters work in combination and show personal watch state.
- Calendar shows monthly view and screening cards.
- Leaderboard ranks correctly by both metrics.
- Profile shows Vault tabs and the user's ratings grid.
- All pages responsive on mobile, tablet, and desktop.

## 9. NEXT STEPS

Ordered roadmap to take the front-end prototype to a complete, deployed app running on real data.

### 9.0 Status (updated 2026-09-14)

**Stack.** React 19 + Vite 8 + Tailwind CSS v4. Supabase wired client-side through `@supabase/supabase-js`, `@tanstack/react-query` for server state. No Next.js — `CLAUDE.md` pins this repo to Vite.

**Live & deployed.** Production Supabase project created, `schema.sql` run, and seeded (1186 movies, demo users, reviews, polls, screenings). Vercel deploy: `https://absolutecinema-rust.vercel.app`. The `src/lib/` facade falls back to a `localStorage` mock when `.env` is absent.

**Done.**
- Auth: email/password (sign-up restricted to `@tsinglan.org`) + Google; session-driven navbar and sign-in modal.
- Admin console gated by a club code (not role): correct code unlocks the console and promotes the signed-in user to `admin` so admin writes pass RLS.
- Featured reviews: admins toggle any review as featured; the landing hero carousel shows only featured reviews (falls back to the newest 3 when none are featured).
- Edit profile: change username + upload avatar.
- Realtime: `postgres_changes` subscriptions invalidate review-vote / comment / poll-vote caches live.
- Validation: zod schemas in `src/lib/validation.ts`.
- Notifications: `notifications` table + triggers + UI.
- Storage: poster and avatar uploads to Supabase Storage.
- Reviews, polls, vault, following, screenings, and leaderboard read/write through the facade — live, mock otherwise.

**Not yet done.**
- TMDb integration — the catalog is a static seed (1186 movies); no live TMDb import.
- Accessibility pass.

### 9.1 Remaining code (ordered)

1. TMDb: add a movie catalog import (TMDb key), or keep the seed list — decide before launch.
2. Accessibility: keyboard navigation, ARIA labels, focus states; confirm responsiveness.

### 9.2 Deploy + go-live (done)

Supabase project created, `schema.sql` run, `.env` set, seed run, Vercel deployed. Remaining manual work is only inviting members.