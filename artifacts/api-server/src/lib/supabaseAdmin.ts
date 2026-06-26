import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

const url = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

export const isSupabaseAdminConfigured = Boolean(url && serviceKey);

if (!isSupabaseAdminConfigured) {
  console.warn(
    "[supabaseAdmin] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — admin endpoints will fail.",
  );
}

export const supabaseAdmin: SupabaseClient = isSupabaseAdminConfigured
  ? createClient(url!, serviceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws as unknown as typeof WebSocket,
      },
    })
  : (null as unknown as SupabaseClient);
