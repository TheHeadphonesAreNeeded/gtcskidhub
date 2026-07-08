// Shared domain types used across the SkidHub frontend.
// The Netlify Functions keep their own copy under netlify/functions/_shared
// so they can bundle independently of the Next.js build.

export type Role = "user" | "moderator" | "owner";

export const ROLE_RANK: Record<Role, number> = {
  user: 1,
  moderator: 2,
  owner: 3,
};

export interface User {
  id: string;
  discord_id: string;
  username: string;
  display_name: string | null;
  avatar: string | null;
  role: Role;
  // Approved (via an accepted application) to post copies in Community.
  // Separate from the role/asset-upload permission. Owners can always post.
  can_post: boolean;
  created_at: string;
}

// Whether a user may post copies in the Community area.
export function canPostCopies(
  user: { role: Role; can_post?: boolean } | null
): boolean {
  if (!user) return false;
  return user.role === "owner" || !!user.can_post;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  version: string;
  thumbnail: string | null;
  google_drive_url: string;
  category: string;
  tags: string[];
  downloads: number;
  file_size: string | null;
  // Minimum role required to unlock the download button.
  download_role: Role;
  author: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface DownloadLog {
  id: string;
  project_id: string;
  user_id: string;
  username: string;
  project_name: string;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalDownloads: number;
  totalModerators: number;
}

export const CATEGORIES = [
  "Projects",
  "Mod Menus",
  "Scripts/mods",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// Community submissions — copies people post themselves, linked on an
// external store (Meta / Horizon or itch.io) rather than a Drive file.
export type StoreType = "meta" | "itch";

// Uploader applications — users apply, owners accept (which promotes them to
// moderator so they can upload). One application per user.
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Application {
  id: string;
  user_id: string;
  discord_username: string;
  game_link: string;
  known_as: string;
  game_image: string | null;
  discord_invite: string;
  reason: string;
  status: ApplicationStatus;
  created_at: string;
  reviewed_at: string | null;
}

export interface Submission {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  store_url: string;
  store_type: StoreType;
  discord_invite: string | null;
  author: string;
  author_id: string | null;
  created_at: string;
}

export function roleAllows(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}
