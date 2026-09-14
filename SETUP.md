# Absolute Cinema — Setup & Deploy Run Book

The app runs in two modes:

- **Mock mode** (no config): everything works off a `localStorage`-backed store so the prototype behaves exactly as before. No Supabase needed.
- **Live mode**: point it at a Supabase project and it reads/writes real Postgres through the client SDK.

This guide covers turning on live mode and deploying to Vercel. Steps marked **YOU** need a browser or a Supabase/Vercel account; everything else is already written for you in this repo.

---

## 1. Create the Supabase project — YOU

1. Go to <https://supabase.com> and sign up / sign in.
2. Click **New project**, pick an org, name it `absolute-cinema`, choose a region, and set a strong **Database password** (save it — you won't need it again here, but you'll need it for any direct DB access).
3. Wait for the project to finish provisioning (a couple of minutes).

## 2. Run the schema — YOU (one-time)

1. In the Supabase dashboard, open your project, then the **SQL Editor**.
2. Open `supabase/schema.sql` in this repo.
3. Copy the entire file and paste it into the SQL Editor, then **Run**.

This creates all tables, Row-Level Security policies, the `is_admin()` helper, the `handle_new_user()` trigger, the `get_leaderboard()` RPC, the `announcements` table, the notification triggers (`notify_on_comment`, `notify_on_follow`), the Realtime publication for live updates, and the `posters`/`avatars` Storage buckets with their policies.

> If you ever change the schema, re-run the file. It uses `create table if not exists` / `create or replace`, so it's safe to re-run.

## 3. Grab the env keys — YOU

1. In the dashboard, go to **Project Settings → API**.
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
3. Create a file at the repo root named `.env` with:

   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   (`.env` is git-ignored; `.env.example` shows the shape.)

4. Restart the Vite dev server so it picks up the new vars. The app now talks to Supabase.

## 4. Seed demo data — YOU (one-time)

1. In **Project Settings → API**, scroll to **service_role** and copy that key (it's secret — never commit it).
2. Run:

   ```bash
   SUPABASE_URL=https://your-project-ref.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
   npm run seed
   ```

   On Windows PowerShell, use `$env:` instead:

   ```powershell
   $env:SUPABASE_URL="https://your-project-ref.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   npm run seed
   ```

This creates 32 movies, 10 demo users, 6 reviews, comments, 3 polls, 5 screenings, and the demo user's vault.

- **Demo login:** `cinemavault@example.com` / `password123`
- The demo user is created with the **admin** role, so it can see the Admin console.

## 5. Invite members & promote admins — YOU

- New members sign up through the app's **Sign in → Create an account** flow (email + password, or Google once you configure a Google provider in **Authentication → Providers**).
- **Promote/demote admins in-app:** the **Admin → Members** panel lists every member with a **Make admin / Remove admin** toggle. No SQL needed.
- To make someone an admin *before* they exist (or in bulk), open **Authentication → Users** and set `role` in metadata — or run this in the SQL Editor:

  ```sql
  update public.profiles set role = 'admin' where username = 'their-username';
  ```

  The `handle_new_user()` trigger copies `role` from auth metadata into `profiles` on signup.

- To invite people by email directly (no self-serve signup), use **Authentication → Users → Invite user** in the dashboard — invites are sent from the Supabase project and can't be triggered from the browser client.

## 6. Deploy to Vercel — YOU

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Go to <https://vercel.com>, **Add New → Project**, import the repo.
3. Vercel auto-detects Vite. Leave the build settings as-is.
4. Under **Environment Variables**, add the same two:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. Production URL is live.

## 7. Post-deploy checklist

- [ ] Sign in as `cinemavault@example.com` — Admin nav link appears.
- [ ] Write a review → it appears and persists after refresh.
- [ ] Vote a poll → results persist.
- [ ] Save a movie to favorites → shows in Profile → Cinema Vault.
- [ ] Calendar shows the seeded screenings.
- [ ] Leaderboard shows the seeded users.
- [ ] Second browser / incognito signs up a new member and sees the same data.

---

## Local dev cheat sheet

```bash
npm run dev               # start dev server (mock mode until .env is filled)
npm run build             # production build (types are stripped; use tsc for a real check)
npx tsc --noEmit          # full type check
npm run seed              # seed the configured Supabase project (service role)
```
