"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import Logo from "@/components/Logo";
import { LOGIN_URL } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";

const DISCORD_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.317 4.369A19.79 19.79 0 0 0 15.885 3c-.2.36-.43.84-.59 1.23a18.27 18.27 0 0 0-5.6 0A12.6 12.6 0 0 0 9.1 3a19.74 19.74 0 0 0-4.43 1.37C1.86 8.58 1.1 12.68 1.48 16.72a19.9 19.9 0 0 0 6.06 3.08c.49-.67.93-1.38 1.3-2.13-.71-.27-1.4-.6-2.04-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.2 0c.17.14.34.27.5.4-.65.39-1.34.72-2.05.99.38.75.81 1.46 1.3 2.13a19.85 19.85 0 0 0 6.07-3.08c.44-4.68-.76-8.74-3.2-12.35ZM8.52 14.34c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.95 2.42-2.15 2.42Zm6.96 0c-1.18 0-2.15-1.09-2.15-2.42 0-1.34.95-2.43 2.15-2.43 1.2 0 2.17 1.1 2.15 2.43 0 1.33-.94 2.42-2.15 2.42Z" />
  </svg>
);

const FEATURES = [
  {
    icon: "🦍",
    title: "Curated Copies",
    body: "Every Gorilla Tag copy is organized with versions, categories, tags and thumbnails so you find what you need fast.",
  },
  {
    icon: "🔒",
    title: "Role-Gated Downloads",
    body: "Configure exactly who can pull each copy — public, moderators, or owners only.",
  },
  {
    icon: "⚡",
    title: "Instant Access",
    body: "Downloads open your stored Google Drive links in a new tab. No waiting rooms, no clutter.",
  },
  {
    icon: "📊",
    title: "Owner Analytics",
    body: "Track total users, copies, downloads and moderators from a live admin dashboard.",
  },
];

const ROLES = [
  {
    name: "Owner",
    color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
    perks: ["Upload & manage everything", "Promote moderators", "View analytics & logs"],
  },
  {
    name: "Moderator",
    color: "from-violet-500/20 to-indigo-500/10 border-violet-500/30",
    perks: ["Upload copies", "Edit own uploads", "Delete own uploads"],
  },
  {
    name: "User",
    color: "from-white/10 to-white/5 border-white/10",
    perks: ["Browse the catalogue", "Read descriptions", "Favorite copies"],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

export default function LandingPage() {
  const { user } = useAuth();

  // Surface OAuth error states from the callback redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth")) {
      // Clean the URL so a refresh doesn't re-show the message.
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-brand-purple/20 blur-[120px]" />
        <div className="absolute right-1/4 top-1/3 h-72 w-72 rounded-full bg-brand-blue/20 blur-[120px]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-950/60 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/dashboard/projects" className="btn-ghost hidden sm:inline-flex">
              Browse Copies
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                Dashboard
              </Link>
            ) : (
              <a href={LOGIN_URL} className="btn-primary">
                {DISCORD_ICON} Login
              </a>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 14 }}
          className="mb-8"
        >
          <Logo size={88} withText={false} />
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Verified access platform
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
        >
          Download Exclusive{" "}
          <span className="accent-text">Gorilla Tag Copies</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          custom={2}
          initial="hidden"
          animate="show"
          className="mt-5 max-w-xl text-base text-slate-400 sm:text-lg"
        >
          Verified Owners and Moderators can access exclusive Gorilla Tag copies.
        </motion.p>

        <motion.div
          variants={fadeUp}
          custom={3}
          initial="hidden"
          animate="show"
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          {user ? (
            <Link href="/dashboard" className="btn-primary px-7 py-3 text-base">
              Go to Dashboard
            </Link>
          ) : (
            <a href={LOGIN_URL} className="btn-primary px-7 py-3 text-base">
              {DISCORD_ICON} Login with Discord
            </a>
          )}
          <Link
            href="/dashboard/projects"
            className="btn-ghost px-7 py-3 text-base"
          >
            Browse Copies
          </Link>
        </motion.div>
      </section>

      {/* Feature glass cards */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="glass glass-hover p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl accent-gradient text-2xl shadow-glow">
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-6xl px-6 pb-28">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-3 text-center text-3xl font-bold"
        >
          Built around <span className="accent-text">permission tiers</span>
        </motion.h2>
        <p className="mx-auto mb-12 max-w-lg text-center text-slate-400">
          Three roles keep the hub organized and your exclusive files in the
          right hands.
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.name}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className={`glass glass-hover bg-gradient-to-b p-7 ${r.color}`}
            >
              <h3 className="mb-4 text-xl font-bold text-white">{r.name}</h3>
              <ul className="space-y-2.5">
                {r.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-0.5 text-emerald-400">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="glass relative overflow-hidden p-10 text-center"
        >
          <div className="pointer-events-none absolute inset-0 accent-gradient opacity-10" />
          <h2 className="relative mb-3 text-3xl font-bold">
            Ready to get in?
          </h2>
          <p className="relative mb-7 text-slate-300">
            Sign in with Discord to unlock the hub and your role badge.
          </p>
          {user ? (
            <Link href="/dashboard" className="btn-primary relative px-7 py-3 text-base">
              Open Dashboard
            </Link>
          ) : (
            <a href={LOGIN_URL} className="btn-primary relative px-7 py-3 text-base">
              {DISCORD_ICON} Login with Discord
            </a>
          )}
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-500 sm:flex-row">
          <Logo size={28} />
          <p>© {new Date().getFullYear()} SkidHub. Built with Next.js & Netlify.</p>
        </div>
      </footer>
    </div>
  );
}
