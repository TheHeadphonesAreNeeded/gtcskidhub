import type { Handler, HandlerEvent } from "@netlify/functions";
import { getAdminClient } from "./_shared/supabase";
import { getSessionUser, hasRole } from "./_shared/auth";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  methodNotAllowed,
  safe,
} from "./_shared/http";
import { sanitizeString, parseJsonBody } from "./_shared/validate";

// POST { project_id } -> verifies the user's role meets the project's
// required download_role, records a download log, increments the counter,
// and returns the Google Drive URL for the client to open in a new tab.
export const handler: Handler = safe(async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return methodNotAllowed(["POST"]);
  }

  const user = await getSessionUser(event);
  if (!user) return unauthorized("Log in with Discord to download");

  const body = parseJsonBody<{ project_id?: string }>(event.body);
  const projectId = sanitizeString(body.project_id, 60);
  if (!projectId) return badRequest("project_id is required");

  const supabase = getAdminClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, google_drive_url, download_role, downloads")
    .eq("id", projectId)
    .single();

  if (error || !project) return notFound("Project not found");

  // Enforce the per-project download permission.
  if (!hasRole(user, project.download_role)) {
    return forbidden(
      `This download is restricted to ${project.download_role}s and above`
    );
  }

  // Record the download and bump the counter (best-effort, non-blocking
  // for the user experience but awaited so the count stays accurate).
  await supabase.from("download_logs").insert({
    project_id: project.id,
    user_id: user.id,
    username: user.display_name || user.username,
    project_name: project.name,
  });

  await supabase
    .from("projects")
    .update({ downloads: (project.downloads ?? 0) + 1 })
    .eq("id", project.id);

  return ok({ url: project.google_drive_url });
});
