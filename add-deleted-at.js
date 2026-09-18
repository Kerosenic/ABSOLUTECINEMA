// Add deleted_at column via Supabase management API
// Run: node add-deleted-at.js

const SUPABASE_URL = 'https://ptoybrghbnuxxwyqxvrl.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_SERVICE_ROLE_KEY env var first');
  process.exit(1);
}

// Use pg_meta API to alter table
const sql = 'ALTER TABLE public.movies ADD COLUMN IF NOT EXISTS deleted_at timestamptz';

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
