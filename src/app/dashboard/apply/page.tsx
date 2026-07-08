"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { api } from "@/lib/api";
import { canPostCopies, type Application } from "@/lib/types";
import { formatDate } from "@/lib/format";

const EMPTY = {
  discord_username: "",
  game_link: "",
  known_as: "",
  game_image: "",
  discord_invite: "",
  reason: "",
};

export default function ApplyPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  const canAlreadyPost = canPostCopies(user);

  useEffect(() => {
    if (canAlreadyPost) {
      setLoading(false);
      return;
    }
    api
      .get<{ application: Application | null }>("applications?mine=true")
      .then((res) => {
        setApplication(res.application);
        if (res.application && res.application.status !== "rejected") {
          // keep the read-only status view
        } else if (user) {
          setForm((f) => ({
            ...f,
            discord_username: user.username,
            known_as: user.display_name || user.username,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAlreadyPost]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { application } = await api.post<{ application: Application }>(
        "applications",
        form
      );
      setApplication(application);
      toast("Application submitted — an owner will review it", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="glass h-64 skeleton" />;
  }

  // Already approved to post copies (or an owner).
  if (canAlreadyPost) {
    return (
      <div className="glass mx-auto max-w-lg p-10 text-center">
        <p className="mb-2 text-4xl">✅</p>
        <h1 className="mb-2 text-xl font-bold">You can already post copies</h1>
        <p className="text-slate-400">
          Your account is approved. Head to Community to post a copy.
        </p>
      </div>
    );
  }

  // Pending / accepted status view.
  if (application && application.status !== "rejected") {
    const pending = application.status === "pending";
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <div className="glass p-10 text-center">
          <p className="mb-2 text-4xl">{pending ? "⏳" : "🎉"}</p>
          <h1 className="mb-2 text-xl font-bold">
            {pending ? "Application pending" : "Application accepted"}
          </h1>
          <p className="text-slate-400">
            {pending
              ? "An owner will review your application soon. You'll be able to post copies in Community if you're accepted."
              : "You've been accepted! Refresh the page — you can now post copies in Community."}
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Submitted {formatDate(application.created_at)}
          </p>
        </div>
      </div>
    );
  }

  // Form (no application yet, or previously rejected).
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Apply to post copies</h1>
        <p className="text-sm text-slate-400">
          Posting copies in Community is invite-only. Fill this out and an owner
          will review it.
          {application?.status === "rejected" &&
            " Your previous application was declined — you can apply again."}
        </p>
      </div>

      <form onSubmit={submit} className="glass space-y-5 p-7">
        <div>
          <label className="label" htmlFor="a-user">
            Your Discord username
          </label>
          <input
            id="a-user"
            className="input"
            value={form.discord_username}
            onChange={(e) => set("discord_username", e.target.value)}
            placeholder="yourname"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="a-link">
            Game link
          </label>
          <input
            id="a-link"
            className="input"
            value={form.game_link}
            onChange={(e) => set("game_link", e.target.value)}
            placeholder="https://…"
            maxLength={1000}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="a-known">
            What you want to be known as
          </label>
          <input
            id="a-known"
            className="input"
            value={form.known_as}
            onChange={(e) => set("known_as", e.target.value)}
            placeholder="Display name"
            maxLength={80}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="a-img">
            Game image URL <span className="text-slate-600">(optional)</span>
          </label>
          <input
            id="a-img"
            className="input"
            value={form.game_image}
            onChange={(e) => set("game_image", e.target.value)}
            placeholder="https://…/image.png"
            maxLength={1000}
          />
        </div>
        <div>
          <label className="label" htmlFor="a-invite">
            Discord invite
          </label>
          <input
            id="a-invite"
            className="input"
            value={form.discord_invite}
            onChange={(e) => set("discord_invite", e.target.value)}
            placeholder="https://discord.gg/…"
            maxLength={200}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="a-reason">
            Why you should get in
          </label>
          <textarea
            id="a-reason"
            className="input min-h-[120px] resize-y"
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
            placeholder="Tell the owners why you'd be a good uploader…"
            maxLength={2000}
            required
          />
        </div>

        <motion.button
          type="submit"
          className="btn-primary w-full py-3"
          disabled={saving}
          whileTap={{ scale: 0.98 }}
        >
          {saving ? "Submitting…" : "Submit application"}
        </motion.button>
      </form>
    </div>
  );
}
