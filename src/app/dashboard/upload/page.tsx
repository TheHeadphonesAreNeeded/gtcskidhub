"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import ProjectForm from "@/components/ProjectForm";
import { roleAllows } from "@/lib/types";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Client-side guard; the function enforces this again server-side.
  if (user && !roleAllows(user.role, "moderator")) {
    return (
      <div className="glass p-12 text-center">
        <p className="mb-2 text-4xl">🔒</p>
        <h1 className="mb-2 text-xl font-bold">Moderators only</h1>
        <p className="text-slate-400">
          Only Moderators and Owners can upload projects. Ask an owner for a
          promotion.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Project</h1>
        <p className="text-sm text-slate-400">
          Share a new drop with the hub. All fields are validated before saving.
        </p>
      </div>

      <div className="glass p-7">
        <ProjectForm
          mode="create"
          onSaved={() => router.push("/dashboard/projects")}
          onCancel={() => router.push("/dashboard/projects")}
        />
      </div>
    </div>
  );
}
