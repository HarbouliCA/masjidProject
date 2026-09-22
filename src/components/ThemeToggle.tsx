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
      className="rounded-lg border border-nour-gold-300/60 px-3 py-1.5 text-sm text-nour-stone-400 hover:text-nour-gold-600"
    >
      {dark ? t.lightMode : t.darkMode}
    </button>
  );
}
