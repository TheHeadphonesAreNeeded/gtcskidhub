"use client";

import { useState } from "react";
import { CATEGORIES, type Project, type Role } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

interface ProjectFormProps {
  initial?: Partial<Project>;
  mode: "create" | "edit";
  onSaved: (project: Project) => void;
  onCancel?: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

const DOWNLOAD_ROLES: { value: Role; label: string }[] = [
  { value: "user", label: "Everyone (Users+)" },
  { value: "moderator", label: "Moderators & Owners" },
  { value: "owner", label: "Owners only" },
];

function isGoogleDrive(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.endsWith("google.com");
  } catch {
    return false;
  }
}

export default function ProjectForm({
  initial,
  mode,
  onSaved,
  onCancel,
}: ProjectFormProps) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    version: initial?.version ?? "1.0.0",
    thumbnail: initial?.thumbnail ?? "",
    google_drive_url: initial?.google_drive_url ?? "",
    file_size: initial?.file_size ?? "",
    category: initial?.category ?? "Scripts",
    tags: (initial?.tags ?? []).join(", "),
    download_role: (initial?.download_role ?? "user") as Role,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: FieldErrors = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length < 2) e.name = "Name is too short";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.version.trim()) e.version = "Version is required";
    if (!form.google_drive_url.trim())
      e.google_drive_url = "Google Drive link is required";
    else if (!isGoogleDrive(form.google_drive_url.trim()))
      e.google_drive_url = "Must be a valid Google Drive link";
    if (form.thumbnail.trim()) {
      try {
        new URL(form.thumbnail.trim());
      } catch {
        e.thumbnail = "Must be a valid URL";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const result =
        mode === "create"
          ? await api.post<{ project: Project }>("projects", payload)
          : await api.put<{ project: Project }>("projects", {
              id: initial?.id,
              ...payload,
            });
      toast(
        mode === "create" ? "Project uploaded" : "Project updated",
        "success"
      );
      onSaved(result.project);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) =>
    errors[k] ? (
      <p className="mt-1 text-xs text-rose-400">{errors[k]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Awesome Project"
            maxLength={120}
          />
          {err("name")}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="input min-h-[120px] resize-y"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What does this project do?"
            maxLength={4000}
          />
          {err("description")}
        </div>

        <div>
          <label className="label" htmlFor="version">
            Version
          </label>
          <input
            id="version"
            className="input"
            value={form.version}
            onChange={(e) => set("version", e.target.value)}
            placeholder="1.0.0"
          />
          {err("version")}
        </div>

        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="input"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-surface-800">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="thumbnail">
            Thumbnail URL <span className="text-slate-600">(optional)</span>
          </label>
          <input
            id="thumbnail"
            className="input"
            value={form.thumbnail}
            onChange={(e) => set("thumbnail", e.target.value)}
            placeholder="https://…/image.png"
          />
          {err("thumbnail")}
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="drive">
            Google Drive Link
          </label>
          <input
            id="drive"
            className="input"
            value={form.google_drive_url}
            onChange={(e) => set("google_drive_url", e.target.value)}
            placeholder="https://drive.google.com/…"
          />
          {err("google_drive_url")}
        </div>

        <div>
          <label className="label" htmlFor="filesize">
            File Size <span className="text-slate-600">(optional)</span>
          </label>
          <input
            id="filesize"
            className="input"
            value={form.file_size}
            onChange={(e) => set("file_size", e.target.value)}
            placeholder="12.4 MB"
          />
        </div>

        <div>
          <label className="label" htmlFor="downloadRole">
            Download Permission
          </label>
          <select
            id="downloadRole"
            className="input"
            value={form.download_role}
            onChange={(e) => set("download_role", e.target.value as Role)}
          >
            {DOWNLOAD_ROLES.map((r) => (
              <option key={r.value} value={r.value} className="bg-surface-800">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="tags">
            Tags <span className="text-slate-600">(comma separated)</span>
          </label>
          <input
            id="tags"
            className="input"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="lua, roblox, gui"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1 py-3" disabled={saving}>
          {saving
            ? "Saving…"
            : mode === "create"
            ? "Upload Project"
            : "Save Changes"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost px-6">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
