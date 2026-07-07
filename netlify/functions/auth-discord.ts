import type { Handler } from "@netlify/functions";
import { serialize } from "cookie";
import { requireEnv, siteUrl } from "./_shared/env";
import { safe } from "./_shared/http";
import crypto from "crypto";

// Step 1 of Discord OAuth2: redirect the user to Discord's consent screen.
// A random `state` value is stored in a short-lived cookie and verified on
// the callback to defend against CSRF.
export const handler: Handler = safe(async () => {
  const clientId = requireEnv("DISCORD_CLIENT_ID");
  const redirectUri =
    process.env.DISCORD_REDIRECT_URI ||
    `${siteUrl()}/.netlify/functions/auth-callback`;

  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });

  const stateCookie = serialize("skidhub_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://discord.com/oauth2/authorize?${params.toString()}`,
      "Set-Cookie": stateCookie,
      "Cache-Control": "no-store",
    },
    body: "",
  };
});
