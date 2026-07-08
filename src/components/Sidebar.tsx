"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import RoleBadge from "@/components/RoleBadge";
import { useAuth } from "@/components/providers/AuthProvider";
import { roleAllows } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▤" },
  { href: "/dashboard/projects", label: "Assets", icon: "◈" },
  { href: "/dashboard/community", label: "Community", icon: "✦" },
  { href: "/dashboard/favorites", label: "Favorites", icon: "★" },
  { href: "/dashboard/profile", label: "Profile", icon: "◉" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const canUpload = user && roleAllows(user.role, "moderator");
  const isOwner = user && roleAllows(user.role, "owner");

  const items = [...NAV];
  if (canUpload) {
    items.splice(2, 0, { href: "/dashboard/upload", label: "Upload", icon: "⬆" });
  } else if (user) {
    // Regular users apply for upload access instead.
    items.splice(2, 0, { href: "/dashboard/apply", label: "Apply", icon: "✎" });
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/5 bg-surface-900/70 backdrop-blur-xl">
      <div className="px-6 py-6">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 -z-10 rounded-xl accent-gradient opacity-90"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="w-4 text-center opacity-90">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {isOwner && (
          <>
            <div className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Owner
            </div>
            <Link
              href="/dashboard/admin"
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                pathname.startsWith("/dashboard/admin")
                  ? "text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {pathname.startsWith("/dashboard/admin") && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 -z-10 rounded-xl accent-gradient opacity-90"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="w-4 text-center">⚑</span>
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {user && (
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.username}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full ring-2 ring-white/10"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full accent-gradient text-sm font-bold">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user.display_name || user.username}
              </p>
              <RoleBadge role={user.role} size="sm" />
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-ghost mt-3 w-full py-2 text-xs"
          >
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
