import type { Handler, HandlerEvent } from "@netlify/functions";
import { getAdminClient } from "./_shared/supabase";
import { getSessionUser, hasRole } from "./_shared/auth";
import {
  ok,
  unauthorized,
  forbidden,
  methodNotAllowed,
  safe,
} from "./_shared/http";

// Owner-only dashboard statistics + recent download logs.
export const handler: Handler = safe(async (event: HandlerEvent) => {
  if (event.httpMethod !== "GET") return methodNotAllowed(["GET"]);

  const user = await getSessionUser(event);
  if (!user) return unauthorized();
  if (!hasRole(user, "owner")) return forbidden("Owner access required");

  const supabase = getAdminClient();

  const [users, projects, downloads, mods, logs] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("download_logs")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "moderator"),
    supabase
      .from("download_logs")
      .select("id, project_name, username, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return ok({
    stats: {
      totalUsers: users.count ?? 0,
      totalProjects: projects.count ?? 0,
      totalDownloads: downloads.count ?? 0,
      totalModerators: mods.count ?? 0,
    },
    recentDownloads: logs.data ?? [],
  });
});
