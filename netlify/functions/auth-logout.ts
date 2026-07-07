import type { Handler } from "@netlify/functions";
import { clearSessionCookie } from "./_shared/auth";
import { ok, safe } from "./_shared/http";

// Clears the session cookie. The frontend then redirects to the landing page.
export const handler: Handler = safe(async () => {
  return ok({ ok: true }, { "Set-Cookie": clearSessionCookie() });
});
