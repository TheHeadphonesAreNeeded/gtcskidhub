"use client";

import {
  useSettings,
  ACCENT_MAP,
  type AccentColor,
} from "@/components/providers/SettingsProvider";
import { useToast } from "@/components/providers/ToastProvider";

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      role="switch"
      aria-checked={enabled}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        enabled ? "accent-gradient" : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "left-0.5 translate-x-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-0">
      <div>
        <p className="font-medium text-white">{title}</p>
        <p className="text-sm text-slate-400">{desc}</p>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const toast = useToast();

  const accents: AccentColor[] = ["purple", "blue", "indigo", "emerald", "rose"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400">
          Personalize how SkidHub looks and feels. Saved to this browser.
        </p>
      </div>

      <div className="glass p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Appearance
        </h2>

        <Row title="Dark Mode" desc="Use the dark theme across the app.">
          <Toggle
            enabled={settings.darkMode}
            onChange={(v) => update({ darkMode: v })}
          />
        </Row>

        <Row title="Animations" desc="Enable motion and transitions.">
          <Toggle
            enabled={settings.animations}
            onChange={(v) => update({ animations: v })}
          />
        </Row>

        <Row title="Compact Mode" desc="Tighten spacing to fit more on screen.">
          <Toggle
            enabled={settings.compact}
            onChange={(v) => update({ compact: v })}
          />
        </Row>

        <div className="py-4">
          <p className="mb-1 font-medium text-white">Accent Color</p>
          <p className="mb-4 text-sm text-slate-400">
            Choose the highlight gradient used throughout SkidHub.
          </p>
          <div className="flex flex-wrap gap-3">
            {accents.map((a) => {
              const c = ACCENT_MAP[a];
              const active = settings.accent === a;
              return (
                <button
                  key={a}
                  onClick={() => update({ accent: a })}
                  aria-label={a}
                  className={`h-10 w-10 rounded-full transition ${
                    active
                      ? "ring-2 ring-white ring-offset-2 ring-offset-surface-900"
                      : "hover:scale-110"
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={() => toast("Settings saved to this browser", "success")}
        className="btn-primary w-full py-3"
      >
        Done
      </button>
    </div>
  );
}
