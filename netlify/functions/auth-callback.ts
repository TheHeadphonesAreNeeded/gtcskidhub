import type { Handler, HandlerEvent } from "@netlify/functions";
import { parse } from "cookie";
import { requireEnv, siteUrl, ownerDiscordIds } from "./_shared/env";
import { getAdminClient } from "./_shared/supabase";
import { signSession, sessionCookie } from "./_shared/auth";
import { safe } from "./_shared/http";
import type { Role } from "./_shared/types";

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
}

function redirect(location: string, cookies: string[] = []) {
  return {
    statusCode: 302,
    multiValueHeaders: cookies.length
      ? { "Set-Cookie": cookies }
      : undefined,
    headers: { Location: location, "Cache-Control": "no-store" },
    body: "",
  };
}

// Step 2 of Discord OAuth2: exchange the authorization code for an access
// token, load the Discord profile, upsert the user, then set a signed
// session cookie and redirect into the dashboard.
export const handler: Handler = safe(async (event: HandlerEvent) => {
  const code = event.queryStringParameters?.code;
  const state = event.queryStringParameters?.state;
  const cookies = parse(event.headers.cookie || event.headers.Cookie || "");
  const expectedState = cookies["skidhub_oauth_state"];

  if (!code) {
    return redirect(`${siteUrl()}/?auth=error`);
  }
  // CSRF protection: the state returned by Discord must match our cookie.
  if (!state || !expectedState || state !== expectedState) {
    return redirect(`${siteUrl()}/?auth=state_mismatch`);
  }

  const redirectUri =
    process.env.DISCORD_REDIRECT_URI ||
    `${siteUrl()}/.netlify/functions/auth-callback`;

  // Exchange the code for an access token.
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("DISCORD_CLIENT_ID"),
      client_secret: requireEnv("DISCORD_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[skidhub] discord token exchange failed", await tokenRes.text());
    return redirect(`${siteUrl()}/?auth=token_error`);
  }

  const token = (await tokenRes.json()) as { access_token: string };

  // Load the Discord profile.
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  if (!userRes.ok) {
    return redirect(`${siteUrl()}/?auth=profile_error`);
  }

  const discordUser = (await userRes.json()) as DiscordUser;

  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${
        discordUser.avatar.startsWith("a_") ? "gif" : "png"
      }?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${
        (BigInt(discordUser.id) >> 22n) % 6n
      }.png`;

  const supabase = getAdminClient();

  // Determine whether this Discord ID should be an owner.
  const isConfiguredOwner = ownerDiscordIds().includes(discordUser.id);

  // Look for an existing record so we don't clobber a stored role.
  const { data: existing } = await supabase
    .from("users")
    .select("id, role")
    .eq("discord_id", discordUser.id)
    .maybeSingle();

  let role: Role = "user";
  if (existing) {
    role = (existing.role as Role) ?? "user";
    // Promote configured owners even if they existed before.
    if (isConfiguredOwner) role = "owner";
  } else if (isConfiguredOwner) {
    role = "owner";
  }

  const payload = {
    discord_id: discordUser.id,
    username: discordUser.username,
    display_name: discordUser.global_name ?? discordUser.username,
    avatar: avatarUrl,
    role,
  };

  const { data: upserted, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "discord_id" })
    .select("id, discord_id")
    .single();

  if (error || !upserted) {
    console.error("[skidhub] user upsert failed", error);
    return redirect(`${siteUrl()}/?auth=db_error`);
  }

  const jwtToken = signSession(upserted.id, upserted.discord_id);

  // Clear the one-time state cookie and set the session cookie.
  const clearedState =
    "skidhub_oauth_state=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";

  return redirect(`${siteUrl()}/dashboard`, [
    sessionCookie(jwtToken),
    clearedState,
  ]);
});
