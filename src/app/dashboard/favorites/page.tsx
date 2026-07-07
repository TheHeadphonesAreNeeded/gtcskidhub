"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { ProjectGridSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

export default function FavoritesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ projects: Project[] }>("favorites")
      .then((res) => setProjects(res.projects))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favorites</h1>
        <p className="text-sm text-slate-400">
          Copies you&apos;ve starred for quick access.
        </p>
      </div>

      {loading ? (
        <ProjectGridSkeleton count={3} />
      ) : projects.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="mb-2 text-4xl">★</p>
          <p className="mb-4 text-slate-400">No favorites yet.</p>
          <Link href="/dashboard/projects" className="btn-primary">
            Browse Copies
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              favorited
              onToggleFavorite={(id, fav) => {
                if (!fav) setProjects((list) => list.filter((x) => x.id !== id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
