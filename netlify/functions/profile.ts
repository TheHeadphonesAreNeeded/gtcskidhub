import type { Handler, HandlerEvent } from "@netlify/functions";
import { getAdminClient } from "./_shared/supabase";
import { getSessionUser } from "./_shared/auth";
import { ok, unauthorized, methodNotAllowed, safe } from "./_shared/http";

// Returns the current user's uploaded projects and favorited projects,
// used to render the Profile page.
export const handler: Handler = safe(async (event: HandlerEvent) => {
  if (event.httpMethod !== "GET") return methodNotAllowed(["GET"]);

  const user = await getSessionUser(event);
  if (!user) return unauthorized();

  const supabase = getAdminClient();

  const [uploaded, favorites] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("favorites")
      .select("projects(*)")
      .eq("user_id", user.id),
  ]);

  return ok({
    uploaded: uploaded.data ?? [],
    favorites: (favorites.data ?? []).map((f) => f.projects).filter(Boolean),
  });
});
