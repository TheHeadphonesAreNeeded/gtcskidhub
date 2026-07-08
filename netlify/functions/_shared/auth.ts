import type { HandlerEvent } from "@netlify/functions";
import jwt from "jsonwebtoken";
import { parse, serialize } from "cookie";
import { requireEnv } from "./env";
import { getAdminClient } from "./supabase";
import type { Role, SessionUser } from "./types";

const COOKIE_NAME = "skidhub_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  sub: string; // internal user id
  discord_id: string;
}

// Sign a session token containing only the user's id — role and profile
// are always re-read from the database so a demotion takes effect at once.
export function signSession(userId: string, discordId: string): string {
  return jwt.sign(
    { sub: userId, discord_id: discordId } satisfies SessionPayload,
    requireEnv("SESSION_SECRET"),
    { expiresIn: MAX_AGE_SECONDS }
  );
}

export function sessionCookie(token: string): string {
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(): string {
  return serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function readToken(event: HandlerEvent): string | null {
  const header = event.headers.cookie || event.headers.Cookie;
  if (!header) return null;
  const cookies = parse(header);
  return cookies[COOKIE_NAME] || null;
}

// Resolve the current user from the request cookie, re-reading the fresh
// record (including role) from the database. Returns null if unauthenticated.
export async function getSessionUser(
  event: HandlerEvent
): Promise<SessionUser | null> {
  const token = readToken(event);
  if (!token) return null;

  let payload: SessionPayload;
  try {
    payload = jwt.verify(token, requireEnv("SESSION_SECRET")) as SessionPayload;
  } catch {
    return null;
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, discord_id, username, display_name, avatar, role, can_post")
    .eq("id", payload.sub)
    .single();

  if (error || !data) return null;
  return data as SessionUser;
}

export function hasRole(user: SessionUser | null, required: Role): boolean {
  if (!user) return false;
  const rank: Record<Role, number> = { user: 1, moderator: 2, owner: 3 };
  return rank[user.role] >= rank[required];
}
