// Supabase Edge Function: delete a user account (admin only).
// The browser client has only the anon key, so it cannot call the auth admin
// API. This function runs with the service-role key and verifies the caller is
// an admin before deleting the target user.
// Deploy: `supabase functions deploy delete-user`

import { createClient } from "jsr:@supabase/supabase-js@2";

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

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  let body: { userId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const targetId = typeof body.userId === "string" ? body.userId : "";
  if (!targetId) return json({ error: "userId required" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return json({ error: "Supabase env vars missing" }, 500);

  const sb = createClient(url, serviceRole, { auth: { persistSession: false } });

  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);
  if (user.id === targetId) return json({ error: "Cannot delete yourself" }, 400);

  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || profile.role !== "admin") return json({ error: "Forbidden" }, 403);

  // Deleting the auth user cascades to profiles and all dependent rows
  // (reviews, comments, votes, library entries, etc.) via FK on-delete-cascade.
  const { error } = await sb.auth.admin.deleteUser(targetId);
  if (error) return json({ error: error.message }, 400);

  return json({ ok: true });
});
