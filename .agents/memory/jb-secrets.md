---
name: JB Jewellery required secrets
description: All environment secrets needed for the JB Jewellery app to function
---

# Required secrets

| Secret | Purpose |
|--------|---------|
| SUPABASE_URL | Supabase project URL (also set as VITE_SUPABASE_URL) |
| SUPABASE_SERVICE_ROLE_KEY | Service-role key for server-side DB access |
| VITE_SUPABASE_URL | Same as SUPABASE_URL — used by frontend |
| VITE_SUPABASE_ANON_KEY | Anon/public key for frontend Supabase client |
| ADMIN_EMAIL | Email used to log into /admin panel |
| ADMIN_PASSWORD | Password used to log into /admin panel (also the auth token) |

**Why:** API server validates admin login against ADMIN_EMAIL + ADMIN_PASSWORD env vars. All Supabase calls require the service role key. Frontend needs VITE_ prefixed vars for browser-side auth.

**How to apply:** The Supabase schema must be run first in the Supabase SQL editor before any API calls work. Schema file is at `supabase-schema.sql` in the project root.
