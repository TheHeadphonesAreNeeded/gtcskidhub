"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type AccentColor = "purple" | "blue" | "indigo" | "emerald" | "rose";

export interface Settings {
  darkMode: boolean;
  accent: AccentColor;
  animations: boolean;
  compact: boolean;
}

const DEFAULTS: Settings = {
  darkMode: true,
  accent: "purple",
  animations: true,
  compact: false,
};

export const ACCENT_MAP: Record<AccentColor, { from: string; to: string }> = {
  purple: { from: "#8b5cf6", to: "#6366f1" },
  blue: { from: "#3b82f6", to: "#06b6d4" },
  indigo: { from: "#6366f1", to: "#8b5cf6" },
  emerald: { from: "#10b981", to: "#3b82f6" },
  rose: { from: "#f43f5e", to: "#8b5cf6" },
};

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULTS,
  update: () => {},
});

const STORAGE_KEY = "skidhub_settings";

function applyToDocument(settings: Settings) {
  const root = document.documentElement;
  const accent = ACCENT_MAP[settings.accent];
  root.style.setProperty("--accent-from", accent.from);
  root.style.setProperty("--accent-to", accent.to);
  root.classList.toggle("dark", settings.darkMode);
  root.classList.toggle("no-animations", !settings.animations);
  root.classList.toggle("compact", settings.compact);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const loaded = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
      setSettings(loaded);
      applyToDocument(loaded);
    } catch {
      applyToDocument(DEFAULTS);
    }
  }, []);

  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      applyToDocument(next);
      return next;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
