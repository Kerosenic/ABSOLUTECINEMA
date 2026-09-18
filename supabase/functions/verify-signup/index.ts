// Supabase Edge Function: verify the code, then create the confirmed account.
// The auth user is created ONLY here, after the code checks out — so an email
// with no verified code has no account to sign in to.
// Deploy: `supabase functions deploy verify-signup`

import { createClient } from "jsr:@supabase/supabase-js@2";

const DOMAIN = "tsinglan.org";
const MAX_ATTEMPTS = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { email?: string; password?: string; username?: string; code?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const username = (body.username || "").trim();
  const code = (body.code || "").trim();

  if (email.split("@")[1] !== DOMAIN) {
    return json({ error: `Sign up is restricted to @${DOMAIN} email addresses` }, 400);
  }
  if (password.length < 6) return json({ error: "Password must be at least 6 characters" }, 400);
  if (username.length < 2) return json({ error: "Username needs at least 2 characters" }, 400);
  if (!/^\d{6}$/.test(code)) return json({ error: "Enter the 6-digit code" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return json({ error: "Supabase env vars missing" }, 500);

  const sb = createClient(url, serviceRole, { auth: { persistSession: false } });

  const { data: row } = await sb.from("signup_codes").select("*").eq("email", email).maybeSingle();
  if (!row) return json({ error: "No code sent for this email. Request one first." }, 400);
  if (row.attempts >= MAX_ATTEMPTS) return json({ error: "Too many attempts. Request a new code." }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return json({ error: "Code expired. Request a new one." }, 400);
  }
  if (row.code !== code) {
    await sb.from("signup_codes").update({ attempts: row.attempts + 1 }).eq("email", email);
    return json({ error: "Wrong code" }, 400);
  }

  await sb.from("signup_codes").delete().eq("email", email);

  const { error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });
  if (error) {
    if (/already|registered|unique/i.test(error.message)) {
      return json({ error: "An account with this email already exists. Sign in instead." }, 409);
    }
    return json({ error: error.message }, 400);
  }

  return json({ ok: true });
});
