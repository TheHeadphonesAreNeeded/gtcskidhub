import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let cached: SupabaseClient | null = null;

// A service-role client used only on the server (inside functions). It
// bypasses row-level security, so every function must enforce its own
// authorization checks before touching data.
export function getAdminClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  return cached;
}
