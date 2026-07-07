import type { Role } from "@/lib/types";

const STYLES: Record<Role, { label: string; className: string; icon: string }> = {
  owner: {
    label: "Owner",
    className:
      "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30",
    icon: "👑",
  },
  moderator: {
    label: "Moderator",
    className:
      "bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border border-violet-500/30",
    icon: "🛡️",
  },
  user: {
    label: "User",
    className: "bg-white/5 text-slate-300 border border-white/10",
    icon: "👤",
  },
};

export default function RoleBadge({
  role,
  size = "md",
}: {
  role: Role;
  size?: "sm" | "md";
}) {
  const s = STYLES[role] ?? STYLES.user;
  return (
    <span
      className={`badge ${s.className} ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : ""
      }`}
    >
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}
