"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/i18n";

export function ThemeToggle({ t }: { t: Dictionary }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("nour-theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("nour-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs sm:text-sm font-medium text-foreground/90 shadow-xs hover:bg-surface-hover hover:text-foreground hover:border-nour-gold-500/50 transition-colors focus:outline-none focus:ring-2 focus:ring-nour-gold-500/40"
      aria-label={dark ? t.lightMode : t.darkMode}
    >
      <span className="text-sm" aria-hidden="true">
        {dark ? "☀️" : "🌙"}
      </span>
      <span>{dark ? t.lightMode : t.darkMode}</span>
    </button>
  );
}
