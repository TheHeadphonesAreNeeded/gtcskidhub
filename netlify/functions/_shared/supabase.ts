import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
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
      // We only use the REST/PostgREST API, never realtime, but the client
      // constructs a realtime socket eagerly and throws on Node runtimes
      // without a global WebSocket. Supplying one keeps it happy everywhere.
      realtime: { transport: WebSocket as unknown as never },
    }
  );
  return cached;
}
