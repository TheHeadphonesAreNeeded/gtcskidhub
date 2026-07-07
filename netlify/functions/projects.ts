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
import {
  sanitizeString,
  isNonEmpty,
  isGoogleDriveUrl,
  isValidUrl,
  parseTags,
  parseJsonBody,
} from "./_shared/validate";
import type { Role } from "./_shared/types";

const VALID_ROLES: Role[] = ["user", "moderator", "owner"];

const SELECT =
  "id, name, description, version, thumbnail, google_drive_url, category, tags, downloads, file_size, download_role, author, author_id, created_at, updated_at";

// Build & validate a project payload from a request body.
function buildPayload(body: Record<string, unknown>) {
  const name = sanitizeString(body.name, 120);
  const description = sanitizeString(body.description, 4000);
  const version = sanitizeString(body.version, 40) || "1.0.0";
  const category = sanitizeString(body.category, 40) || "Other";
  const thumbnail = sanitizeString(body.thumbnail, 1000);
  const googleDriveUrl = sanitizeString(body.google_drive_url, 1000);
  const fileSize = sanitizeString(body.file_size, 40);
  const tags = parseTags(body.tags);
  const downloadRoleRaw = sanitizeString(body.download_role, 20) as Role;
  const download_role: Role = VALID_ROLES.includes(downloadRoleRaw)
    ? downloadRoleRaw
    : "user";

  const errors: string[] = [];
  if (!isNonEmpty(name)) errors.push("Name is required");
  if (!isNonEmpty(description)) errors.push("Description is required");
  if (!isNonEmpty(googleDriveUrl)) {
    errors.push("Google Drive link is required");
  } else if (!isGoogleDriveUrl(googleDriveUrl)) {
    errors.push("Download link must be a valid Google Drive URL");
  }
  if (thumbnail && !isValidUrl(thumbnail)) {
    errors.push("Thumbnail must be a valid URL");
  }

  return {
    errors,
    value: {
      name,
      description,
      version,
      category,
      thumbnail: thumbnail || null,
      google_drive_url: googleDriveUrl,
      file_size: fileSize || null,
      tags,
      download_role,
    },
  };
}

async function listProjects(event: HandlerEvent) {
  const q = event.queryStringParameters || {};
  const supabase = getAdminClient();
  let query = supabase.from("projects").select(SELECT);

  if (q.category && q.category !== "all") {
    query = query.eq("category", q.category);
  }
  if (q.search) {
    const term = sanitizeString(q.search, 100);
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  switch (q.sort) {
    case "downloads":
      query = query.order("downloads", { ascending: false });
      break;
    case "alpha":
      query = query.order("name", { ascending: true });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;
  if (error) {
    console.error("[skidhub] list projects error", error);
    return badRequest("Could not load projects");
  }
  return ok({ projects: data ?? [] });
}

export const handler: Handler = safe(async (event: HandlerEvent) => {
  const method = event.httpMethod;

  // Anyone signed in (or not) can browse the catalogue.
  if (method === "GET") {
    return listProjects(event);
  }

  // Everything else requires at least a moderator.
  const user = await getSessionUser(event);
  if (!user) return unauthorized();

  const supabase = getAdminClient();

  if (method === "POST") {
    if (!hasRole(user, "moderator")) {
      return forbidden("Only moderators and owners can upload projects");
    }
    const body = parseJsonBody(event.body);
    const { errors, value } = buildPayload(body);
    if (errors.length) return badRequest(errors.join(", "));

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...value,
        author: user.display_name || user.username,
        author_id: user.id,
        downloads: 0,
      })
      .select(SELECT)
      .single();

    if (error) {
      console.error("[skidhub] create project error", error);
      return badRequest("Could not create project");
    }
    return ok({ project: data });
  }

  if (method === "PUT") {
    const body = parseJsonBody<{ id?: string } & Record<string, unknown>>(
      event.body
    );
    const id = sanitizeString(body.id, 60);
    if (!id) return badRequest("Project id is required");

    const { data: existing, error: fetchErr } = await supabase
      .from("projects")
      .select("id, author_id")
      .eq("id", id)
      .single();
    if (fetchErr || !existing) return notFound("Project not found");

    // Owners can edit anything; moderators only their own uploads.
    const isOwner = hasRole(user, "owner");
    if (!isOwner && existing.author_id !== user.id) {
      return forbidden("You can only edit your own projects");
    }

    const { errors, value } = buildPayload(body);
    if (errors.length) return badRequest(errors.join(", "));

    const { data, error } = await supabase
      .from("projects")
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(SELECT)
      .single();

    if (error) {
      console.error("[skidhub] update project error", error);
      return badRequest("Could not update project");
    }
    return ok({ project: data });
  }

  if (method === "DELETE") {
    const id =
      event.queryStringParameters?.id ||
      sanitizeString(parseJsonBody<{ id?: string }>(event.body).id, 60);
    if (!id) return badRequest("Project id is required");

    const { data: existing, error: fetchErr } = await supabase
      .from("projects")
      .select("id, author_id")
      .eq("id", id)
      .single();
    if (fetchErr || !existing) return notFound("Project not found");

    const isOwner = hasRole(user, "owner");
    if (!isOwner && existing.author_id !== user.id) {
      return forbidden("You can only delete your own projects");
    }

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      console.error("[skidhub] delete project error", error);
      return badRequest("Could not delete project");
    }
    return ok({ ok: true });
  }

  return methodNotAllowed(["GET", "POST", "PUT", "DELETE"]);
});
