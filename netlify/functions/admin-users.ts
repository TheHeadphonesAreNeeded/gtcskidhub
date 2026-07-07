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
import type { Role } from "./_shared/types";

const VALID_ROLES: Role[] = ["user", "moderator", "owner"];

// Owner-only user management: list, change role, delete.
export const handler: Handler = safe(async (event: HandlerEvent) => {
  const user = await getSessionUser(event);
  if (!user) return unauthorized();
  if (!hasRole(user, "owner")) return forbidden("Owner access required");

  const supabase = getAdminClient();

  if (event.httpMethod === "GET") {
    const { data, error } = await supabase
      .from("users")
      .select("id, discord_id, username, display_name, avatar, role, created_at")
      .order("created_at", { ascending: false });
    if (error) return badRequest("Could not load users");
    return ok({ users: data ?? [] });
  }

  if (event.httpMethod === "PUT") {
    const body = parseJsonBody<{ id?: string; role?: string }>(event.body);
    const id = sanitizeString(body.id, 60);
    const role = sanitizeString(body.role, 20) as Role;
    if (!id) return badRequest("User id is required");
    if (!VALID_ROLES.includes(role)) return badRequest("Invalid role");

    // Guard: an owner cannot demote themselves out of the last owner seat.
    if (id === user.id && role !== "owner") {
      const { count } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "owner");
      if ((count ?? 0) <= 1) {
        return forbidden("You are the only owner — promote someone first");
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update({ role })
      .eq("id", id)
      .select("id, discord_id, username, display_name, avatar, role, created_at")
      .single();
    if (error || !data) return notFound("User not found");
    return ok({ user: data });
  }

  if (event.httpMethod === "DELETE") {
    const id =
      event.queryStringParameters?.id ||
      sanitizeString(parseJsonBody<{ id?: string }>(event.body).id, 60);
    if (!id) return badRequest("User id is required");
    if (id === user.id) return forbidden("You cannot delete your own account");

    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) return badRequest("Could not delete user");
    return ok({ ok: true });
  }

  return methodNotAllowed(["GET", "PUT", "DELETE"]);
});
