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
  detectStoreType,
  parseJsonBody,
} from "./_shared/validate";

const SELECT =
  "id, title, description, thumbnail, store_url, store_type, author, author_id, created_at";

// Community submissions: copies people post themselves, linked on an external
// store (Meta / Horizon Worlds or itch.io). Any signed-in user may post; a
// user can delete their own, and owners can delete any.
export const handler: Handler = safe(async (event: HandlerEvent) => {
  const method = event.httpMethod;
  const supabase = getAdminClient();

  // Public listing.
  if (method === "GET") {
    const { data, error } = await supabase
      .from("submissions")
      .select(SELECT)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[skidhub] list submissions error", error);
      return badRequest("Could not load community posts");
    }
    return ok({ submissions: data ?? [] });
  }

  const user = await getSessionUser(event);
  if (!user) return unauthorized();

  if (method === "POST") {
    const body = parseJsonBody(event.body);
    const title = sanitizeString(body.title, 120);
    const description = sanitizeString(body.description, 2000);
    const thumbnail = sanitizeString(body.thumbnail, 1000);
    const storeUrl = sanitizeString(body.store_url, 1000);

    const errors: string[] = [];
    if (!isNonEmpty(title)) errors.push("Title is required");
    if (!isNonEmpty(description)) errors.push("Description is required");
    const storeType = detectStoreType(storeUrl);
    if (!isNonEmpty(storeUrl)) {
      errors.push("A Meta or itch.io link is required");
    } else if (!storeType) {
      errors.push("Link must be a Meta (meta.com/oculus.com) or itch.io URL");
    }
    if (thumbnail && !isValidUrl(thumbnail)) {
      errors.push("Thumbnail must be a valid URL");
    }
    if (errors.length) return badRequest(errors.join(", "));

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        title,
        description,
        thumbnail: thumbnail || null,
        store_url: storeUrl,
        store_type: storeType,
        author: user.display_name || user.username,
        author_id: user.id,
      })
      .select(SELECT)
      .single();

    if (error) {
      console.error("[skidhub] create submission error", error);
      return badRequest("Could not create post");
    }
    return ok({ submission: data });
  }

  if (method === "DELETE") {
    const id =
      event.queryStringParameters?.id ||
      sanitizeString(parseJsonBody<{ id?: string }>(event.body).id, 60);
    if (!id) return badRequest("Post id is required");

    const { data: existing, error: fetchErr } = await supabase
      .from("submissions")
      .select("id, author_id")
      .eq("id", id)
      .single();
    if (fetchErr || !existing) return notFound("Post not found");

    // Owners can remove anything; everyone else only their own posts.
    if (!hasRole(user, "owner") && existing.author_id !== user.id) {
      return forbidden("You can only delete your own posts");
    }

    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) return badRequest("Could not delete post");
    return ok({ ok: true });
  }

  return methodNotAllowed(["GET", "POST", "DELETE"]);
});
