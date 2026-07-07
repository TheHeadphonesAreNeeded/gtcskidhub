// Domain types shared by the Netlify Functions. Kept separate from the
// frontend copy (src/lib/types.ts) so functions bundle independently.

export type Role = "user" | "moderator" | "owner";

export const ROLE_RANK: Record<Role, number> = {
  user: 1,
  moderator: 2,
  owner: 3,
};

export function roleAllows(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export interface SessionUser {
  id: string;
  discord_id: string;
  username: string;
  display_name: string | null;
  avatar: string | null;
  role: Role;
}
