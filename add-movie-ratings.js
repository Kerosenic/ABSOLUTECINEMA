// Add movie_ratings table + RLS via Supabase management API
// Run: SUPABASE_SERVICE_ROLE_KEY=... node add-movie-ratings.js

const SUPABASE_URL = 'https://ptoybrghbnuxxwyqxvrl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var first');
  process.exit(1);
}

const sql = `
create table if not exists public.movie_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  movie_id text not null references public.movies(id) on delete cascade,
  rating int not null check (rating between 1 and 10),
  created_at timestamptz not null default now(),
  unique (user_id, movie_id)
);

alter table public.movie_ratings enable row level security;

drop policy if exists "movie_ratings public read" on public.movie_ratings;
create policy "movie_ratings public read" on public.movie_ratings for select using (true);
drop policy if exists "movie_ratings owner insert" on public.movie_ratings;
create policy "movie_ratings owner insert" on public.movie_ratings for insert with check (auth.uid() = user_id);
drop policy if exists "movie_ratings owner update" on public.movie_ratings;
create policy "movie_ratings owner update" on public.movie_ratings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "movie_ratings owner delete" on public.movie_ratings;
create policy "movie_ratings owner delete" on public.movie_ratings for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.movie_ratings to anon, authenticated, service_role;
`;

fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: sql })
})
.then(r => r.json())
.then(d => console.log('Result:', d))
.catch(e => console.error('Error:', e));
