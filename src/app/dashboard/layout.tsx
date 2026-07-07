"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import Logo from "@/components/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { LOGIN_URL } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <Logo size={56} withText={false} animated={false} />
        </motion.div>
      </div>
    );
  }

  // Auth gate — you need at least a User account to enter the hub.
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="glass max-w-md p-10 text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={64} withText={false} />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Sign in to continue</h1>
          <p className="mb-7 text-sm text-slate-400">
            SkidHub is a verified-access platform. Log in with Discord to browse
            projects and unlock your role.
          </p>
          <a href={LOGIN_URL} className="btn-primary w-full py-3">
            Login with Discord
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-ghost px-3 py-2"
            aria-label="Open menu"
          >
            ☰
          </button>
          <Logo size={28} />
          <span className="w-10" />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== "undefined" ? window.location.pathname : ""}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
