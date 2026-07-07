"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Project } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import { api } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

interface ProjectCardProps {
  project: Project;
  favorited?: boolean;
  onToggleFavorite?: (id: string, favorited: boolean) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  canManage?: boolean;
  index?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Projects: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  "Mod Menus": "text-sky-300 bg-sky-500/10 border-sky-500/20",
  "Scripts/mods": "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  Other: "text-slate-300 bg-white/5 border-white/10",
};

export default function ProjectCard({
  project,
  favorited = false,
  onToggleFavorite,
  onEdit,
  onDelete,
  canManage = false,
  index = 0,
}: ProjectCardProps) {
  const toast = useToast();
  const [isFav, setIsFav] = useState(favorited);
  const [downloading, setDownloading] = useState(false);
  const [downloads, setDownloads] = useState(project.downloads);

  async function handleFavorite() {
    const optimistic = !isFav;
    setIsFav(optimistic);
    try {
      const res = await api.post<{ favorited: boolean }>("favorites", {
        project_id: project.id,
      });
      setIsFav(res.favorited);
      onToggleFavorite?.(project.id, res.favorited);
    } catch (e) {
      setIsFav(!optimistic);
      toast((e as Error).message, "error");
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const { url } = await api.post<{ url: string }>("download", {
        project_id: project.id,
      });
      setDownloads((d) => d + 1);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setDownloading(false);
    }
  }

  const catColor = CATEGORY_COLORS[project.category] || CATEGORY_COLORS.Other;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="glass glass-hover group flex flex-col overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-surface-800">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center accent-gradient opacity-30">
            <span className="text-4xl font-black text-white/40">
              {project.name[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <button
          onClick={handleFavorite}
          aria-label={isFav ? "Remove favorite" : "Add favorite"}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition ${
            isFav
              ? "bg-amber-500/90 text-white"
              : "bg-black/40 text-white/80 hover:bg-black/60"
          }`}
        >
          {isFav ? "★" : "☆"}
        </button>
        <span
          className={`badge absolute left-3 top-3 border ${catColor}`}
        >
          {project.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight text-white">
            {project.name}
          </h3>
          <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-mono text-slate-400">
            v{project.version}
          </span>
        </div>

        <p className="mb-4 line-clamp-2 text-sm text-slate-400">
          {project.description}
        </p>

        {project.tags?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-slate-400"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">by {project.author}</span>
            <span>{formatDate(project.created_at)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>⬇ {formatNumber(downloads)} downloads</span>
            <span>{project.file_size || "—"}</span>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary w-full py-2.5"
          >
            {downloading ? "Preparing…" : "Download"}
          </button>

          {canManage && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit?.(project)}
                className="btn-ghost flex-1 py-2 text-xs"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete?.(project)}
                className="btn-danger flex-1 py-2 text-xs"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
