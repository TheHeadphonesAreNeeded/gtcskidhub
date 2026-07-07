import type { Handler, HandlerEvent } from "@netlify/functions";
import { getAdminClient } from "./_shared/supabase";
import { getSessionUser } from "./_shared/auth";
import {
  ok,
  badRequest,
  unauthorized,
  methodNotAllowed,
  safe,
} from "./_shared/http";
import { sanitizeString, parseJsonBody } from "./_shared/validate";

// GET  -> list the current user's favorite project ids (and full rows)
// POST -> toggle a favorite { project_id }
export const handler: Handler = safe(async (event: HandlerEvent) => {
  const user = await getSessionUser(event);
  if (!user) return unauthorized();

  const supabase = getAdminClient();

  if (event.httpMethod === "GET") {
    const { data, error } = await supabase
      .from("favorites")
      .select("project_id, projects(*)")
      .eq("user_id", user.id);

    if (error) {
      console.error("[skidhub] list favorites error", error);
      return badRequest("Could not load favorites");
    }

    const ids = (data ?? []).map((f) => f.project_id);
    const projects = (data ?? [])
      .map((f) => f.projects)
      .filter(Boolean);
    return ok({ ids, projects });
  }

  if (event.httpMethod === "POST") {
    const body = parseJsonBody<{ project_id?: string }>(event.body);
    const projectId = sanitizeString(body.project_id, 60);
    if (!projectId) return badRequest("project_id is required");

    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .maybeSingle();

    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      return ok({ favorited: false });
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      project_id: projectId,
    });
    if (error) {
      console.error("[skidhub] toggle favorite error", error);
      return badRequest("Could not update favorite");
    }
    return ok({ favorited: true });
  }

  return methodNotAllowed(["GET", "POST"]);
});
