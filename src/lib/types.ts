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
  created_at: string;
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
  "Scripts",
  "Tools",
  "Games",
  "Bots",
  "Templates",
  "Exploits",
  "Utilities",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function roleAllows(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}
