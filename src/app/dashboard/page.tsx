"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import RoleBadge from "@/components/RoleBadge";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { roleAllows } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { ProjectGridSkeleton } from "@/components/Skeleton";
import ProjectCard from "@/components/ProjectCard";

export default function DashboardHome() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ projects }, favs] = await Promise.all([
          api.get<{ projects: Project[] }>("projects?sort=downloads"),
          api.get<{ ids: string[] }>("favorites").catch(() => ({ ids: [] })),
        ]);
        setProjects(projects);
        setFavIds(favs.ids);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalDownloads = projects.reduce((s, p) => s + (p.downloads ?? 0), 0);
  const canUpload = user && roleAllows(user.role, "moderator");

  const stats = [
    { label: "Projects", value: projects.length, icon: "◈" },
    { label: "Total Downloads", value: totalDownloads, icon: "⬇" },
    { label: "Your Favorites", value: favIds.length, icon: "★" },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass flex flex-col gap-4 p-7 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm text-slate-400">Welcome back,</p>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold">
            {user?.display_name || user?.username}
            {user && <RoleBadge role={user.role} />}
          </h1>
        </div>
        {canUpload && (
          <Link href="/dashboard/upload" className="btn-primary">
            ⬆ Upload Project
          </Link>
        )}
      </motion.div>

      {/* Stat tiles */}
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass glass-hover flex items-center gap-4 p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl accent-gradient text-xl shadow-glow">
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {formatNumber(s.value)}
              </p>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {s.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trending */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">🔥 Trending Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-slate-400 hover:text-white"
          >
            View all →
          </Link>
        </div>
        {loading ? (
          <ProjectGridSkeleton count={3} />
        ) : projects.length === 0 ? (
          <div className="glass p-10 text-center text-slate-400">
            No projects yet.{" "}
            {canUpload && (
              <Link href="/dashboard/upload" className="accent-text font-semibold">
                Upload the first one.
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                favorited={favIds.includes(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
