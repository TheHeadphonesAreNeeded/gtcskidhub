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
  isValidUrl,
  isDiscordInvite,
  parseJsonBody,
} from "./_shared/validate";

const SELECT =
  "id, user_id, discord_username, game_link, known_as, game_image, discord_invite, reason, status, created_at, reviewed_at";

// Uploader applications.
//  GET               -> owner: all applications
//  GET ?mine=true    -> the current user's own application (or null)
//  POST              -> submit/resubmit an application (any signed-in user)
//  PUT  {id, action} -> owner accepts (promotes to moderator) or rejects
//  DELETE ?id=       -> owner removes, or user withdraws their own
export const handler: Handler = safe(async (event: HandlerEvent) => {
  const user = await getSessionUser(event);
  if (!user) return unauthorized();

  const supabase = getAdminClient();
  const method = event.httpMethod;

  if (method === "GET") {
    if (event.queryStringParameters?.mine === "true") {
      const { data } = await supabase
        .from("applications")
        .select(SELECT)
        .eq("user_id", user.id)
        .maybeSingle();
      return ok({ application: data ?? null });
    }
    if (!hasRole(user, "owner")) return forbidden("Owner access required");
    const { data, error } = await supabase
      .from("applications")
      .select(SELECT)
      .order("created_at", { ascending: false });
    if (error) return badRequest("Could not load applications");
    return ok({ applications: data ?? [] });
  }

  if (method === "POST") {
    const body = parseJsonBody(event.body);
    const discordUsername = sanitizeString(body.discord_username, 80);
    const gameLink = sanitizeString(body.game_link, 1000);
    const knownAs = sanitizeString(body.known_as, 80);
    const gameImage = sanitizeString(body.game_image, 1000);
    const discordInvite = sanitizeString(body.discord_invite, 200);
    const reason = sanitizeString(body.reason, 2000);

    const errors: string[] = [];
    if (!isNonEmpty(discordUsername)) errors.push("Discord username is required");
    if (!isNonEmpty(gameLink)) errors.push("Game link is required");
    else if (!isValidUrl(gameLink)) errors.push("Game link must be a valid URL");
    if (!isNonEmpty(knownAs)) errors.push("A name to be known as is required");
    if (gameImage && !isValidUrl(gameImage))
      errors.push("Game image must be a valid URL");
    if (!isNonEmpty(discordInvite)) errors.push("Discord invite is required");
    else if (!isDiscordInvite(discordInvite))
      errors.push("Discord invite must be a discord.gg / discord.com invite link");
    if (!isNonEmpty(reason)) errors.push("A reason is required");
    if (errors.length) return badRequest(errors.join(", "));

    // Block duplicate pending/accepted applications; allow re-apply after reject.
    const { data: existing } = await supabase
      .from("applications")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.status === "pending") {
      return badRequest("You already have a pending application");
    }
    if (existing?.status === "accepted") {
      return badRequest("Your application was already accepted");
    }

    const payload = {
      user_id: user.id,
      discord_username: discordUsername,
      game_link: gameLink,
      known_as: knownAs,
      game_image: gameImage || null,
      discord_invite: discordInvite,
      reason,
      status: "pending" as const,
      reviewed_at: null,
    };

    const { data, error } = await supabase
      .from("applications")
      .upsert(payload, { onConflict: "user_id" })
      .select(SELECT)
      .single();

    if (error) {
      console.error("[skidhub] create application error", error);
      return badRequest("Could not submit application");
    }
    return ok({ application: data });
  }

  // Everything below is owner-only.
  if (!hasRole(user, "owner")) {
    // Allow a user to withdraw their own pending application via DELETE.
    if (method === "DELETE") {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("user_id", user.id);
      if (error) return badRequest("Could not withdraw application");
      return ok({ ok: true });
    }
    return forbidden("Owner access required");
  }

  if (method === "PUT") {
    const body = parseJsonBody<{ id?: string; action?: string }>(event.body);
    const id = sanitizeString(body.id, 60);
    const action = sanitizeString(body.action, 20);
    if (!id) return badRequest("Application id is required");
    if (action !== "accept" && action !== "reject") {
      return badRequest("action must be 'accept' or 'reject'");
    }

    const { data: application, error: fetchErr } = await supabase
      .from("applications")
      .select("id, user_id, known_as")
      .eq("id", id)
      .single();
    if (fetchErr || !application) return notFound("Application not found");

    if (action === "accept") {
      // Promote the applicant to moderator so they can upload, and adopt the
      // display name they asked to be known as.
      await supabase
        .from("users")
        .update({ role: "moderator", display_name: application.known_as })
        .eq("id", application.user_id);
    }

    const { data, error } = await supabase
      .from("applications")
      .update({
        status: action === "accept" ? "accepted" : "rejected",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SELECT)
      .single();

    if (error) return badRequest("Could not update application");
    return ok({ application: data });
  }

  if (method === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Application id is required");
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return badRequest("Could not delete application");
    return ok({ ok: true });
  }

  return methodNotAllowed(["GET", "POST", "PUT", "DELETE"]);
});
