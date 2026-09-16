-- Absolute Cinema — Supabase schema (Section 3 + extras)
-- Run this in the Supabase SQL editor, or via `supabase db push`.
-- Idempotent: safe to re-run.

create extension if not exists "pgcrypto";

-- ─── profiles ───────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

-- ─── Helpers ─────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── movies ─────────────────────────────────────────────────────────────
create table if not exists public.movies (
  id text primary key,
  title text not null,
  year int not null,
  genre text not null,
  rating numeric(3,1) not null default 0,
  director text,
  poster_url text
);

-- ─── reviews ────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  movie_id text not null references public.movies(id) on delete cascade,
  title text not null default '',
  poster_url text,
  rating int not null check (rating between 1 and 10),
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reviews add column if not exists featured boolean not null default false;

-- ─── review_votes ───────────────────────────────────────────────────────
create table if not exists public.review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  direction int not null check (direction in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

-- ─── comments ───────────────────────────────────────────────────────────
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ─── polls ──────────────────────────────────────────────────────────────
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

-- ─── poll_options ───────────────────────────────────────────────────────
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  movie_id text,
  title text not null,
  poster_url text,
  position int not null default 0
);

-- ─── poll_votes ─────────────────────────────────────────────────────────
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

-- ─── screenings ─────────────────────────────────────────────────────────
create table if not exists public.screenings (
  id uuid primary key default gen_random_uuid(),
  movie_id text,
  title text not null,
  poster_url text,
  date date not null,
  time time not null,
  location text not null default 'Streaming',
  notes text,
  created_by uuid references public.profiles(id) on delete set null
);

-- ─── library_entries ────────────────────────────────────────────────────
create table if not exists public.library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id text not null references public.movies(id) on delete cascade,
  title text not null default '',
  poster_url text,
  status text not null check (status in ('watched', 'plan_to_watch', 'favorite')),
  rating int check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  unique (user_id, movie_id, status)
);

-- ─── friendships ────────────────────────────────────────────────────────
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- ─── rsvps ──────────────────────────────────────────────────────────────
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references public.screenings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (screening_id, user_id)
);

-- ─── notifications ──────────────────────────────────────────────────────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  body text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications add column if not exists link text;

-- ─── announcements ──────────────────────────────────────────────────────
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────────────────────
create index if not exists idx_reviews_author on public.reviews (author_id);
create index if not exists idx_review_votes_review on public.review_votes (review_id);
create index if not exists idx_comments_review on public.comments (review_id);
create index if not exists idx_poll_options_poll on public.poll_options (poll_id);
create index if not exists idx_poll_votes_option on public.poll_votes (option_id);
create index if not exists idx_poll_votes_poll on public.poll_votes (poll_id);
create index if not exists idx_library_entries_user on public.library_entries (user_id);
create index if not exists idx_friendships_requester on public.friendships (requester_id);

-- ─── Row-Level Security ─────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.movies         enable row level security;
alter table public.reviews        enable row level security;
alter table public.review_votes   enable row level security;
alter table public.comments       enable row level security;
alter table public.polls          enable row level security;
alter table public.poll_options   enable row level security;
alter table public.poll_votes     enable row level security;
alter table public.screenings     enable row level security;
alter table public.library_entries enable row level security;
alter table public.friendships    enable row level security;
alter table public.rsvps          enable row level security;
alter table public.notifications  enable row level security;
alter table public.announcements enable row level security;

-- profiles: public read, owner write (insert via trigger)
drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);
drop policy if exists "profiles owner update" on public.profiles;
create policy "profiles owner update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- movies: public read, admin write
drop policy if exists "movies public read" on public.movies;
create policy "movies public read" on public.movies for select using (true);
drop policy if exists "movies admin write" on public.movies;
create policy "movies admin write" on public.movies for all
  using (is_admin()) with check (is_admin());

-- reviews: public read, owner write
drop policy if exists "reviews public read" on public.reviews;
create policy "reviews public read" on public.reviews for select using (true);
drop policy if exists "reviews owner insert" on public.reviews;
create policy "reviews owner insert" on public.reviews for insert with check (auth.uid() = author_id);
drop policy if exists "reviews owner update" on public.reviews;
create policy "reviews owner update" on public.reviews for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "reviews owner delete" on public.reviews;
create policy "reviews owner delete" on public.reviews for delete using (auth.uid() = author_id or is_admin());
drop policy if exists "reviews admin update" on public.reviews;
create policy "reviews admin update" on public.reviews for update using (is_admin()) with check (is_admin());

-- review_votes: public read, owner write
drop policy if exists "review_votes public read" on public.review_votes;
create policy "review_votes public read" on public.review_votes for select using (true);
drop policy if exists "review_votes owner insert" on public.review_votes;
create policy "review_votes owner insert" on public.review_votes for insert with check (auth.uid() = user_id);
drop policy if exists "review_votes owner update" on public.review_votes;
create policy "review_votes owner update" on public.review_votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "review_votes owner delete" on public.review_votes;
create policy "review_votes owner delete" on public.review_votes for delete using (auth.uid() = user_id);

-- comments: public read, owner write
drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select using (true);
drop policy if exists "comments owner insert" on public.comments;
create policy "comments owner insert" on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists "comments owner update" on public.comments;
create policy "comments owner update" on public.comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "comments owner delete" on public.comments;
create policy "comments owner delete" on public.comments for delete using (auth.uid() = author_id or is_admin());

-- polls: public read, admin write
drop policy if exists "polls public read" on public.polls;
create policy "polls public read" on public.polls for select using (true);
drop policy if exists "polls admin write" on public.polls;
create policy "polls admin write" on public.polls for all using (is_admin()) with check (is_admin());

-- poll_options: public read, admin write
drop policy if exists "poll_options public read" on public.poll_options;
create policy "poll_options public read" on public.poll_options for select using (true);
drop policy if exists "poll_options admin write" on public.poll_options;
create policy "poll_options admin write" on public.poll_options for all using (is_admin()) with check (is_admin());

-- poll_votes: public read, owner write
drop policy if exists "poll_votes public read" on public.poll_votes;
create policy "poll_votes public read" on public.poll_votes for select using (true);
drop policy if exists "poll_votes owner insert" on public.poll_votes;
create policy "poll_votes owner insert" on public.poll_votes for insert with check (auth.uid() = user_id);
drop policy if exists "poll_votes owner update" on public.poll_votes;
create policy "poll_votes owner update" on public.poll_votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "poll_votes owner delete" on public.poll_votes;
create policy "poll_votes owner delete" on public.poll_votes for delete using (auth.uid() = user_id);

-- screenings: public read, admin write
drop policy if exists "screenings public read" on public.screenings;
create policy "screenings public read" on public.screenings for select using (true);
drop policy if exists "screenings admin write" on public.screenings;
create policy "screenings admin write" on public.screenings for all using (is_admin()) with check (is_admin());

-- library_entries: owner-only
drop policy if exists "library_entries owner select" on public.library_entries;
create policy "library_entries owner select" on public.library_entries for select using (auth.uid() = user_id);
drop policy if exists "library_entries owner insert" on public.library_entries;
create policy "library_entries owner insert" on public.library_entries for insert with check (auth.uid() = user_id);
drop policy if exists "library_entries owner update" on public.library_entries;
create policy "library_entries owner update" on public.library_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "library_entries owner delete" on public.library_entries;
create policy "library_entries owner delete" on public.library_entries for delete using (auth.uid() = user_id);

-- friendships: involved users read/write
drop policy if exists "friendships involved read" on public.friendships;
create policy "friendships involved read" on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "friendships requester insert" on public.friendships;
create policy "friendships requester insert" on public.friendships for insert with check (auth.uid() = requester_id);
drop policy if exists "friendships involved delete" on public.friendships;
create policy "friendships involved delete" on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- rsvps: public read, owner write
drop policy if exists "rsvps public read" on public.rsvps;
create policy "rsvps public read" on public.rsvps for select using (true);
drop policy if exists "rsvps owner insert" on public.rsvps;
create policy "rsvps owner insert" on public.rsvps for insert with check (auth.uid() = user_id);
drop policy if exists "rsvps owner delete" on public.rsvps;
create policy "rsvps owner delete" on public.rsvps for delete using (auth.uid() = user_id);

-- notifications: owner-only
drop policy if exists "notifications owner select" on public.notifications;
create policy "notifications owner select" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications owner update" on public.notifications;
create policy "notifications owner update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- announcements: public read, admin write
drop policy if exists "announcements public read" on public.announcements;
create policy "announcements public read" on public.announcements for select using (true);
drop policy if exists "announcements admin write" on public.announcements;
create policy "announcements admin write" on public.announcements for all using (is_admin()) with check (is_admin());

-- ─── Trigger: restrict signups to @tsinglan.org ─────────────────────────
-- Enforced server-side so the client check in lib/api.ts can't be bypassed
-- with a direct API call. Email confirmation must be ON (Auth → Email →
-- "Confirm email") for the verification email to send on sign-up.
create or replace function public.enforce_tsinglan_domain()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or lower(new.email) not like '%@tsinglan.org' then
    raise exception 'Sign up is restricted to @tsinglan.org email addresses';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_domain_check on auth.users;
create trigger on_auth_user_domain_check
  before insert on auth.users
  for each row execute function public.enforce_tsinglan_domain();

-- ─── Trigger: profile on signup ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(coalesce(new.email, 'member'), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Trigger: notify on comment reply ───────────────────────────────────
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  review_author uuid;
  actor_name text;
  movie_title text;
begin
  select r.author_id, r.title into review_author, movie_title
    from public.reviews r where r.id = new.review_id;
  select p.username into actor_name from public.profiles p where p.id = new.author_id;
  if review_author is not null and review_author <> new.author_id then
    insert into public.notifications (user_id, type, body, link)
    values (
      review_author,
      'reply',
      coalesce(actor_name, 'Someone') || ' replied to your review of ' || coalesce(movie_title, 'a movie'),
      new.review_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_comment_created on public.comments;
create trigger on_comment_created
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- ─── Trigger: notify on follow ──────────────────────────────────────────
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  actor_name text;
begin
  select p.username into actor_name from public.profiles p where p.id = new.requester_id;
  insert into public.notifications (user_id, type, body)
  values (
    new.addressee_id,
    'follow',
    coalesce(actor_name, 'Someone') || ' started following you'
  );
  return new;
end;
$$;

drop trigger if exists on_friendship_created on public.friendships;
create trigger on_friendship_created
  after insert on public.friendships
  for each row execute function public.notify_on_follow();

-- ─── Leaderboard aggregate (Section 9 step 16) ─────────────────────────
create or replace function public.get_leaderboard()
returns table (username text, reviews bigint, upvotes bigint)
language sql stable security definer set search_path = public
as $$
  select p.username,
         count(r.id) as reviews,
         coalesce(sum(v.direction), 0) as upvotes
  from public.profiles p
  left join public.reviews r on r.author_id = p.id
  left join public.review_votes v on v.review_id = r.id
  group by p.id, p.username
  order by upvotes desc, reviews desc;
$$;

-- ─── Realtime ───────────────────────────────────────────────────────────
-- Enable Supabase Realtime for the tables the app subscribes to, and use
-- REPLICA IDENTITY FULL so UPDATE/DELETE events carry the old row payload.
alter table public.review_votes replica identity full;
alter table public.comments replica identity full;
alter table public.poll_votes replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.review_votes;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.poll_votes;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- ─── Storage buckets ────────────────────────────────────────────────────
-- Create the poster/avatar buckets (public so their URLs need no signed token).
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- posters: public read, admin write
drop policy if exists "posters public read" on storage.objects;
create policy "posters public read" on storage.objects for select using (bucket_id = 'posters');
drop policy if exists "posters admin insert" on storage.objects;
create policy "posters admin insert" on storage.objects for insert
  with check (bucket_id = 'posters' and public.is_admin());

-- avatars: public read, owner write (object path is {user_id}/{file})
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Grants ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.get_leaderboard() to anon, authenticated, service_role;

-- ─── Sign-up verification codes ─────────────────────────────────────────
-- Holds the 6-digit code a user must type before their auth account exists.
-- Written and read only by the Edge Functions (service_role). Never exposed to
-- anon/authenticated — the blanket grant above is revoked below.
create table if not exists public.signup_codes (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.signup_codes enable row level security;
revoke all on public.signup_codes from anon, authenticated;
grant all on public.signup_codes to service_role;
