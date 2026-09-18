# Absolute Cinema — Setup

Two modes:
- **Mock** (default, no config): data in `localStorage`.
- **Live**: point at Supabase. Fill `.env`, run schema, deploy functions.

Steps marked **YOU** need your account/browser. Rest is already in this repo.

## 1. Create Supabase project — YOU

<https://supabase.com> → **New project** → name `absolute-cinema`, pick region, set DB password.

## 2. Run schema — YOU (one-time)

SQL Editor → open `supabase/schema.sql` → paste full file → **Run**.
Safe to re-run (uses `create table if not exists` / `create or replace`).

## 3. Env keys — YOU

Project Settings → API. Copy **Project URL** and **anon public** key. Create `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart dev server.

## 4. Seed demo data — YOU (one-time)

Project Settings → API → copy **service_role** key. Run:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npm run seed
```

Windows PowerShell uses `$env:` instead:
```powershell
$env:SUPABASE_URL="https://your-project-ref.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
npm run seed
```

Demo login: `cinemavault@example.com` / `password123` (admin).

## 5. Invite & promote admins — YOU

- Members sign up via **Sign in → Create an account**.
- Promote admins: **Admin → Members** panel, or SQL:
  ```sql
  update public.profiles set role = 'admin' where username = 'their-username';
  ```
- Direct invites: **Authentication → Users → Invite user**.

## 6. Deploy to Vercel — YOU

Push repo to GitHub → <https://vercel.com> → **Add New → Project** → import. Add env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Deploy.

## 7. Post-deploy check

- [ ] Sign in as demo user → Admin link appears
- [ ] Review, poll, vault save, calendar, leaderboard all persist after refresh
- [ ] Second browser signs up new member, sees same data

## Local dev

```bash
npm run dev       # mock mode until .env filled
npm run build
npx tsc --noEmit  # type check
npm run seed
```

## Email verification code (sign-up) — YOU

Flow: enter email/password/username → 6-digit code emailed → type code → account created. Needs one-time setup:

1. Re-run `supabase/schema.sql` (adds `signup_codes` table).

2. **Brevo** (<https://www.brevo.com>, free tier):
   - **Senders & IP** → add `absolute.cinema.emailsender@gmail.com` → click confirmation email.
   - **SMTP & API → API Keys** → generate v3 key.

3. Deploy Edge Functions:
   ```bash
   npx supabase login
   npx supabase link --project-ref ptoybrghbnuxxwyqxvrl
   npx supabase secrets set BREVO_API_KEY=xkeysib-xxxxxxxx
   npx supabase functions deploy send-code
   npx supabase functions deploy verify-signup
   ```

   Default sender `absolute.cinema.emailsender@gmail.com` / `Absolute Cinema`. `send-code` calls Brevo HTTPS API — Edge Functions block SMTP ports 25/465/587.

4. Confirm email optional — functions create user already confirmed.

Live once both functions deployed + `BREVO_API_KEY` set.
