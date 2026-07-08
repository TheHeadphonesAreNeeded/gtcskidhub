"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import RoleBadge from "@/components/RoleBadge";
import Modal from "@/components/Modal";
import ProjectForm from "@/components/ProjectForm";
import { StatSkeleton, RowSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import {
  roleAllows,
  type AdminStats,
  type Application,
  type Project,
  type Role,
  type User,
} from "@/lib/types";
import { formatDate, formatNumber, relativeTime } from "@/lib/format";
import { useToast } from "@/components/providers/ToastProvider";

interface DownloadRow {
  id: string;
  project_name: string;
  username: string;
  created_at: string;
}

type Tab = "users" | "projects" | "applications" | "downloads";

export default function AdminPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<DownloadRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("users");

  const [editing, setEditing] = useState<Project | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [statsRes, usersRes, projectsRes, appsRes] = await Promise.all([
        api.get<{ stats: AdminStats; recentDownloads: DownloadRow[] }>(
          "admin-stats"
        ),
        api.get<{ users: User[] }>("admin-users"),
        api.get<{ projects: Project[] }>("projects?sort=newest"),
        api.get<{ applications: Application[] }>("applications"),
      ]);
      setStats(statsRes.stats);
      setRecent(statsRes.recentDownloads);
      setUsers(usersRes.users);
      setProjects(projectsRes.projects);
      setApplications(appsRes.applications);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (user && !roleAllows(user.role, "owner")) {
    return (
      <div className="glass p-12 text-center">
        <p className="mb-2 text-4xl">⚑</p>
        <h1 className="mb-2 text-xl font-bold">Owner access required</h1>
        <p className="text-slate-400">
          The admin panel is restricted to owners.
        </p>
      </div>
    );
  }

  async function changeRole(target: User, role: Role) {
    try {
      const { user: updated } = await api.put<{ user: User }>("admin-users", {
        id: target.id,
        role,
      });
      setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
      toast(`${updated.username} is now ${role}`, "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function deleteUser(target: User) {
    if (!confirm(`Delete ${target.username}? This cannot be undone.`)) return;
    try {
      await api.del(`admin-users?id=${target.id}`);
      setUsers((list) => list.filter((u) => u.id !== target.id));
      toast("User deleted", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function deleteProject(p: Project) {
    if (!confirm(`Delete copy "${p.name}"?`)) return;
    try {
      await api.del(`projects?id=${p.id}`);
      setProjects((list) => list.filter((x) => x.id !== p.id));
      toast("Copy deleted", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function reviewApplication(app: Application, action: "accept" | "reject") {
    try {
      const { application } = await api.put<{ application: Application }>(
        "applications",
        { id: app.id, action }
      );
      setApplications((list) =>
        list.map((a) => (a.id === application.id ? application : a))
      );
      // Reflect the posting-permission change locally.
      setUsers((list) =>
        list.map((u) =>
          u.id === app.user_id
            ? { ...u, can_post: action === "accept" }
            : u
        )
      );
      toast(
        action === "accept"
          ? `${app.known_as} can now post copies`
          : "Application rejected",
        "success"
      );
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const pendingApps = applications.filter((a) => a.status === "pending").length;

  const statTiles = [
    { label: "Total Users", value: stats?.totalUsers, icon: "◉" },
    { label: "Total Copies", value: stats?.totalProjects, icon: "◈" },
    { label: "Downloads", value: stats?.totalDownloads, icon: "⬇" },
    { label: "Moderators", value: stats?.totalModerators, icon: "🛡️" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-slate-400">
          Manage users, copies, and monitor activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : statTiles.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass p-6"
              >
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                  <span>{s.icon}</span>
                  {s.label}
                </div>
                <p className="text-3xl font-bold text-white">
                  {formatNumber(s.value ?? 0)}
                </p>
              </motion.div>
            ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["users", "projects", "applications", "downloads"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative rounded-xl px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? "accent-gradient text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {t === "projects" ? "copies" : t}
            {t === "applications" && pendingApps > 0 && (
              <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingApps}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : tab === "users" ? (
          <UsersTable
            users={users}
            currentUserId={user?.id}
            onChangeRole={changeRole}
            onDelete={deleteUser}
          />
        ) : tab === "projects" ? (
          <ProjectsTable
            projects={projects}
            onEdit={setEditing}
            onDelete={deleteProject}
          />
        ) : tab === "applications" ? (
          <ApplicationsTable
            applications={applications}
            onReview={reviewApplication}
          />
        ) : (
          <DownloadsTable rows={recent} />
        )}
      </div>

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
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

function UsersTable({
  users,
  currentUserId,
  onChangeRole,
  onDelete,
}: {
  users: User[];
  currentUserId?: string;
  onChangeRole: (u: User, r: Role) => void;
  onDelete: (u: User) => void;
}) {
  return (
    <TableWrap>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">User</th>
            <th className="px-5 py-3">Role</th>
            <th className="px-5 py-3">Joined</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-white/5 last:border-0">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  {u.avatar ? (
                    <Image
                      src={u.avatar}
                      alt={u.username}
                      width={32}
                      height={32}
                      unoptimized
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full accent-gradient text-xs font-bold">
                      {u.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {u.display_name || u.username}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {u.discord_id}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">
                <RoleBadge role={u.role} size="sm" />
              </td>
              <td className="px-5 py-3 text-slate-400">
                {formatDate(u.created_at)}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => onChangeRole(u, e.target.value as Role)}
                    className="rounded-lg border border-white/10 bg-surface-800 px-2 py-1 text-xs"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="owner">Owner</option>
                  </select>
                  <button
                    onClick={() => onDelete(u)}
                    disabled={u.id === currentUserId}
                    className="btn-danger px-3 py-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function ProjectsTable({
  projects,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
}) {
  return (
    <TableWrap>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Copy</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Downloads</th>
            <th className="px-5 py-3">Author</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id} className="border-b border-white/5 last:border-0">
              <td className="px-5 py-3 font-medium text-white">{p.name}</td>
              <td className="px-5 py-3 text-slate-400">{p.category}</td>
              <td className="px-5 py-3 text-slate-400">
                {formatNumber(p.downloads)}
              </td>
              <td className="px-5 py-3 text-slate-400">{p.author}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(p)}
                    className="btn-ghost px-3 py-1 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    className="btn-danger px-3 py-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {projects.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                No copies yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
}

function DownloadsTable({ rows }: { rows: DownloadRow[] }) {
  return (
    <TableWrap>
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3">Copy</th>
            <th className="px-5 py-3">User</th>
            <th className="px-5 py-3 text-right">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/5 last:border-0">
              <td className="px-5 py-3 font-medium text-white">
                {r.project_name}
              </td>
              <td className="px-5 py-3 text-slate-400">{r.username}</td>
              <td className="px-5 py-3 text-right text-slate-400">
                {relativeTime(r.created_at)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-5 py-10 text-center text-slate-400">
                No downloads logged yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </TableWrap>
  );
}

const APP_STATUS_STYLE: Record<Application["status"], string> = {
  pending: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  accepted: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
  rejected: "text-rose-300 bg-rose-500/10 border-rose-500/30",
};

function ApplicationsTable({
  applications,
  onReview,
}: {
  applications: Application[];
  onReview: (a: Application, action: "accept" | "reject") => void;
}) {
  if (applications.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-slate-400">
        No applications yet.
      </div>
    );
  }
  return (
    <div className="divide-y divide-white/5">
      {applications.map((a) => (
        <div key={a.id} className="flex flex-col gap-4 p-5 sm:flex-row">
          <div className="shrink-0">
            {a.game_image ? (
              <Image
                src={a.game_image}
                alt={a.known_as}
                width={160}
                height={90}
                unoptimized
                className="h-24 w-40 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-24 w-40 items-center justify-center rounded-lg accent-gradient opacity-30 text-2xl font-black text-white/40">
                {a.known_as[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-white">{a.known_as}</h3>
              <span className={`badge border ${APP_STATUS_STYLE[a.status]}`}>
                {a.status}
              </span>
              <span className="text-xs text-slate-500">
                {formatDate(a.created_at)}
              </span>
            </div>
            <p className="text-sm text-slate-300">
              <span className="text-slate-500">Discord:</span>{" "}
              {a.discord_username}
            </p>
            <p className="text-sm text-slate-400">{a.reason}</p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <a
                href={a.game_link}
                target="_blank"
                rel="noopener noreferrer"
                className="accent-text font-semibold"
              >
                Game link ↗
              </a>
              {a.discord_invite && (
                <a
                  href={a.discord_invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-300"
                >
                  Discord invite ↗
                </a>
              )}
            </div>
          </div>

          {a.status === "pending" && (
            <div className="flex shrink-0 gap-2 sm:flex-col">
              <button
                onClick={() => onReview(a, "accept")}
                className="btn-primary px-4 py-2 text-xs"
              >
                Accept
              </button>
              <button
                onClick={() => onReview(a, "reject")}
                className="btn-danger px-4 py-2 text-xs"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
