"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import RoleBadge from "@/components/RoleBadge";
import ProjectCard from "@/components/ProjectCard";
import { ProjectGridSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default function ProfilePage() {
  const { user } = useAuth();
  const [uploaded, setUploaded] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"uploaded" | "favorites">("uploaded");

  useEffect(() => {
    api
      .get<{ uploaded: Project[]; favorites: Project[] }>("profile")
      .then((res) => {
        setUploaded(res.uploaded);
        setFavorites(res.favorites);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const shown = tab === "uploaded" ? uploaded : favorites;

  return (
    <div className="space-y-8">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative overflow-hidden p-8"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 accent-gradient opacity-20" />
        <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-end">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username}
              width={96}
              height={96}
              unoptimized
              className="h-24 w-24 rounded-2xl ring-4 ring-surface-900"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl accent-gradient text-3xl font-black">
              {user.username[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="flex items-center justify-center gap-3 text-2xl font-bold sm:justify-start">
              {user.display_name || user.username}
              <RoleBadge role={user.role} />
            </h1>
            <p className="text-sm text-slate-400">@{user.username}</p>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
          <InfoTile label="Discord ID" value={user.discord_id} mono />
          <InfoTile label="Joined" value={formatDate(user.created_at)} />
          <InfoTile
            label="Uploads"
            value={`${uploaded.length} cop${uploaded.length === 1 ? "y" : "ies"}`}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["uploaded", "favorites"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? "accent-gradient text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {t} ({t === "uploaded" ? uploaded.length : favorites.length})
          </button>
        ))}
      </div>

      {loading ? (
        <ProjectGridSkeleton count={3} />
      ) : shown.length === 0 ? (
        <div className="glass p-12 text-center text-slate-400">
          Nothing here yet.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              favorited={tab === "favorites"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InfoTile({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-1 truncate text-sm font-semibold text-white ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
