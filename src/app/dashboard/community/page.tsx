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

function isDiscordInvite(url: string): boolean {
  if (!url.trim()) return true; // optional
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h === "discord.gg") return u.pathname.length > 1;
    if (h === "discord.com" || h === "www.discord.com" || h === "discordapp.com")
      return u.pathname.toLowerCase().startsWith("/invite/");
    return false;
  } catch {
    return false;
  }
}

const EMPTY = {
  title: "",
  description: "",
  thumbnail: "",
  store_url: "",
  discord_invite: "",
};

export default function CommunityPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [posts, setPosts] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

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

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setOpen(true);
  }

  function openEdit(p: Submission) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description,
      thumbnail: p.thumbnail ?? "",
      store_url: p.store_url,
      discord_invite: p.discord_invite ?? "",
    });
    setOpen(true);
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
    if (!isDiscordInvite(form.discord_invite.trim())) {
      toast("Discord invite must be a discord.gg / discord.com link", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { submission } = await api.put<{ submission: Submission }>(
          "submissions",
          { id: editingId, ...form }
        );
        setPosts((p) => p.map((x) => (x.id === submission.id ? submission : x)));
        toast("Post updated", "success");
      } else {
        const { submission } = await api.post<{ submission: Submission }>(
          "submissions",
          form
        );
        setPosts((p) => [submission, ...p]);
        toast("Posted to the community", "success");
      }
      setForm({ ...EMPTY });
      setEditingId(null);
      setOpen(false);
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
        <button onClick={openCreate} className="btn-primary">
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
          <button onClick={openCreate} className="btn-primary">
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
                    {p.discord_invite && (
                      <a
                        href={p.discord_invite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost w-full py-2 text-sm"
                        style={{ color: "#c7d2fe" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.2.36-.43.84-.59 1.23a18.27 18.27 0 0 0-5.6 0A12.6 12.6 0 0 0 9.1 3a19.74 19.74 0 0 0-4.43 1.37C1.86 8.58 1.1 12.68 1.48 16.72a19.9 19.9 0 0 0 6.06 3.08c.49-.67.93-1.38 1.3-2.13-.71-.27-1.4-.6-2.04-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.2 0c.17.14.34.27.5.4-.65.39-1.34.72-2.05.99.38.75.81 1.46 1.3 2.13a19.85 19.85 0 0 0 6.07-3.08c.44-4.68-.76-8.74-3.2-12.35ZM8.52 14.34c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.95 2.42-2.15 2.42Zm6.96 0c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.94 2.42-2.15 2.42Z" />
                        </svg>
                        Join Discord
                      </a>
                    )}
                    {canManage(p) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="btn-ghost flex-1 py-2 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(p)}
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
          })}
        </div>
      )}

      {/* Post / edit form */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit post" : "Post a copy"}
      >
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
              Game image URL <span className="text-slate-600">(optional)</span>
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
          </div>
          <div>
            <label className="label" htmlFor="c-invite">
              Discord invite <span className="text-slate-600">(optional)</span>
            </label>
            <input
              id="c-invite"
              className="input"
              value={form.discord_invite}
              onChange={(e) => set("discord_invite", e.target.value)}
              placeholder="https://discord.gg/…"
            />
            <p className="mt-1 text-xs text-slate-500">
              Shown as a &quot;Join Discord&quot; button on your post.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Post"}
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
