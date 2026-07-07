"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import ProjectCard from "@/components/ProjectCard";
import ProjectForm from "@/components/ProjectForm";
import Modal from "@/components/Modal";
import { ProjectGridSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { CATEGORIES, roleAllows, type Project } from "@/lib/types";
import { useToast } from "@/components/providers/ToastProvider";
import { AdUnit } from "@/components/AdSense";

const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";

type Sort = "newest" | "downloads" | "alpha";

export default function ProjectsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const [editing, setEditing] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category !== "all") params.set("category", category);
      params.set("sort", sort);
      const { projects } = await api.get<{ projects: Project[] }>(
        `projects?${params.toString()}`
      );
      setProjects(projects);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [search, category, sort, toast]);

  // Debounce search + filter changes.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api
      .get<{ ids: string[] }>("favorites")
      .then((f) => setFavIds(f.ids))
      .catch(() => setFavIds([]));
  }, []);

  function canManage(p: Project): boolean {
    if (!user) return false;
    return roleAllows(user.role, "owner") || p.author_id === user.id;
  }

  async function doDelete(p: Project) {
    try {
      await api.del(`projects?id=${p.id}`);
      setProjects((list) => list.filter((x) => x.id !== p.id));
      toast("Copy deleted", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Copies</h1>
          <p className="text-sm text-slate-400">
            Browse the full catalogue of exclusive Gorilla Tag copies.
          </p>
        </div>
        {user && roleAllows(user.role, "moderator") && (
          <Link href="/dashboard/upload" className="btn-primary">
            ⬆ Upload
          </Link>
        )}
      </div>

      {/* Controls */}
      <div className="glass space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Search copies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input sm:w-52"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
          >
            <option value="newest" className="bg-surface-800">
              Sort: Newest
            </option>
            <option value="downloads" className="bg-surface-800">
              Sort: Most Downloads
            </option>
            <option value="alpha" className="bg-surface-800">
              Sort: A–Z
            </option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("all")}
            className={`badge border px-3 py-1 transition ${
              category === "all"
                ? "accent-gradient border-transparent text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`badge border px-3 py-1 transition ${
                category === c
                  ? "accent-gradient border-transparent text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Sponsored slot (renders only when AdSense is configured) */}
      {ADSENSE_SLOT && <AdUnit slot={ADSENSE_SLOT} className="glass p-2" />}

      {/* Grid */}
      {loading ? (
        <ProjectGridSkeleton />
      ) : projects.length === 0 ? (
        <div className="glass p-12 text-center text-slate-400">
          No copies match your filters.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              favorited={favIds.includes(p.id)}
              onToggleFavorite={(id, fav) =>
                setFavIds((ids) =>
                  fav ? [...ids, id] : ids.filter((x) => x !== id)
                )
              }
              canManage={canManage(p)}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Copy"
      >
        {editing && (
          <ProjectForm
            mode="edit"
            initial={editing}
            onSaved={(updated) => {
              setProjects((list) =>
                list.map((p) => (p.id === updated.id ? updated : p))
              );
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete copy?"
      >
        {confirmDelete && (
          <div className="space-y-6">
            <p className="text-slate-300">
              This will permanently remove{" "}
              <span className="font-semibold text-white">
                {confirmDelete.name}
              </span>
              . This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => doDelete(confirmDelete)}
                className="btn-danger flex-1 py-3"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost px-6"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
