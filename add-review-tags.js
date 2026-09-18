// Add tags column to reviews via Supabase management API
// Run: SUPABASE_SERVICE_ROLE_KEY=... node add-review-tags.js

const SUPABASE_URL = 'https://ptoybrghbnuxxwyqxvrl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var first');
  process.exit(1);
}

const sql = "ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'";

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
