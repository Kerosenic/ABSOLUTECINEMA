// Supabase Edge Function: send a 6-digit sign-up code to a @tsinglan.org email.
// Deploy: `supabase functions deploy send-code`
// Secrets required: BREVO_API_KEY (and optional BREVO_FROM_EMAIL / BREVO_FROM_NAME).
// Sends via Brevo v3 transactional API over HTTPS (works on Edge Functions,
// unlike SMTP which is blocked on ports 25/465/587).

import { createClient } from "jsr:@supabase/supabase-js@2";

const DOMAIN = "tsinglan.org";
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  if (email.split("@")[1] !== DOMAIN) {
    return json({ error: `Sign up is restricted to @${DOMAIN} email addresses` }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return json({ error: "Supabase env vars missing" }, 500);

  const sb = createClient(url, serviceRole, { auth: { persistSession: false } });

  // 6-digit code. crypto.getRandomValues is a Deno global.
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");

  const { error: dbErr } = await sb.from("signup_codes").upsert({
    email,
    code,
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    attempts: 0,
  });
  if (dbErr) return json({ error: dbErr.message }, 500);

  const brevoKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoKey) return json({ error: "BREVO_API_KEY secret not set" }, 500);
  const fromEmail = Deno.env.get("BREVO_FROM_EMAIL") ?? "absolute.cinema.emailsender@gmail.com";
  const fromName = Deno.env.get("BREVO_FROM_NAME") ?? "Absolute Cinema";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email }],
      subject: "Your Absolute Cinema verification code",
      htmlContent: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p><p>If you don't see this email, check your spam folder.</p>`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Failed to send email (${res.status})`, detail: text.slice(0, 500) }, 502);
  }

  return json({ ok: true });
});
