import type { Handler, HandlerEvent } from "@netlify/functions";
import { getSessionUser } from "./_shared/auth";
import { ok, unauthorized, safe } from "./_shared/http";

// Returns the currently authenticated user (fresh from the database) or 401.
export const handler: Handler = safe(async (event: HandlerEvent) => {
  const user = await getSessionUser(event);
  if (!user) return unauthorized();
  return ok({ user });
});
