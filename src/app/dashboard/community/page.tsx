"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import Modal from "@/components/Modal";
import { ProjectGridSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { roleAllows, type Submission } from "@/lib/types";
import { formatDate } from "@/lib/format";

const STORE_META: Record<
  Submission["store_type"],
  { label: string; badge: string; cta: string }
> = {
  meta: {
    label: "Meta / Horizon",
    badge: "text-blue-300 bg-blue-500/10 border-blue-500/30",
    cta: "Open on Meta",
  },
  itch: {
    label: "itch.io",
    badge: "text-rose-300 bg-rose-500/10 border-rose-500/30",
    cta: "Open on itch.io",
  },
};

function isMetaOrItch(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return (
      h === "itch.io" ||
      h.endsWith(".itch.io") ||
      h.endsWith("meta.com") ||
      h.endsWith("oculus.com")
    );
  } catch {
    return false;
  }
}

export default function CommunityPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnail: "",
    store_url: "",
  });

  useEffect(() => {
    api
      .get<{ submissions: Submission[] }>("submissions")
      .then((res) => setPosts(res.submissions))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast("Title and description are required", "error");
      return;
    }
    if (!isMetaOrItch(form.store_url.trim())) {
      toast("Link must be a Meta or itch.io URL", "error");
      return;
    }
    setSaving(true);
    try {
      const { submission } = await api.post<{ submission: Submission }>(
        "submissions",
        form
      );
      setPosts((p) => [submission, ...p]);
      setForm({ title: "", description: "", thumbnail: "", store_url: "" });
      setOpen(false);
      toast("Posted to the community", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(post: Submission) {
    if (!confirm(`Delete "${post.title}"?`)) return;
    try {
      await api.del(`submissions?id=${post.id}`);
      setPosts((p) => p.filter((x) => x.id !== post.id));
      toast("Post deleted", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  const canManage = (p: Submission) =>
    !!user && (roleAllows(user.role, "owner") || p.author_id === user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-sm text-slate-400">
            Post your own Gorilla Tag copies with a Meta or itch.io link — open
            to everyone.
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          ＋ Post a copy
        </button>
      </div>

      {loading ? (
        <ProjectGridSkeleton count={3} />
      ) : posts.length === 0 ? (
        <div className="glass p-12 text-center">
          <p className="mb-2 text-4xl">✦</p>
          <p className="mb-4 text-slate-400">
            No community posts yet. Be the first to share one.
          </p>
          <button onClick={() => setOpen(true)} className="btn-primary">
            Post a copy
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => {
            const meta = STORE_META[p.store_type] ?? STORE_META.itch;
            return (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
                whileHover={{ y: -6 }}
                className="glass glass-hover flex flex-col overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden bg-surface-800">
                  {p.thumbnail ? (
                    <Image
                      src={p.thumbnail}
                      alt={p.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center accent-gradient opacity-30">
                      <span className="text-4xl font-black text-white/40">
                        {p.title[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className={`badge absolute left-3 top-3 border ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-1 text-lg font-bold text-white">
                    {p.title}
                  </h3>
                  <p className="mb-4 line-clamp-3 text-sm text-slate-400">
                    {p.description}
                  </p>
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate">by {p.author}</span>
                      <span>{formatDate(p.created_at)}</span>
                    </div>
                    <a
                      href={p.store_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full py-2.5"
                    >
                      {meta.cta} ↗
                    </a>
                    {canManage(p) && (
                      <button
                        onClick={() => remove(p)}
                        className="btn-danger w-full py-2 text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Post form */}
      <Modal open={open} onClose={() => setOpen(false)} title="Post a copy">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label" htmlFor="c-title">
              Title
            </label>
            <input
              id="c-title"
              className="input"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="My Gorilla Tag copy"
              maxLength={120}
            />
          </div>
          <div>
            <label className="label" htmlFor="c-desc">
              Description
            </label>
            <textarea
              id="c-desc"
              className="input min-h-[110px] resize-y"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What is it, and what's in it?"
              maxLength={2000}
            />
          </div>
          <div>
            <label className="label" htmlFor="c-thumb">
              Thumbnail URL <span className="text-slate-600">(optional)</span>
            </label>
            <input
              id="c-thumb"
              className="input"
              value={form.thumbnail}
              onChange={(e) => set("thumbnail", e.target.value)}
              placeholder="https://…/image.png"
            />
          </div>
          <div>
            <label className="label" htmlFor="c-store">
              Meta or itch.io Link
            </label>
            <input
              id="c-store"
              className="input"
              value={form.store_url}
              onChange={(e) => set("store_url", e.target.value)}
              placeholder="https://itch.io/…  or  https://www.meta.com/…"
            />
            <p className="mt-1 text-xs text-slate-500">
              Only meta.com / oculus.com and itch.io links are allowed.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={saving}>
              {saving ? "Posting…" : "Post"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost px-6"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
