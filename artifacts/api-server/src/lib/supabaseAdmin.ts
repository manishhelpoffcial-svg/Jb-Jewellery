import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!url || !serviceKey) {
  console.warn(
    "[supabaseAdmin] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — admin endpoints will fail.",
  );
}

export const supabaseAdmin: SupabaseClient = createClient(url || "", serviceKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const isSupabaseAdminConfigured = Boolean(url && serviceKey);
