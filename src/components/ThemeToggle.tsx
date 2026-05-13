"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEMES = ["light", "system", "dark"] as const;
const ICONS: Record<string, string> = {
  light: "light_mode",
  system: "desktop_windows",
  dark: "dark_mode",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = mounted ? (theme || "system") : "system";

  const cycleTheme = () => {
    const idx = THEMES.indexOf(currentTheme as typeof THEMES[number]);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  };

  return (
    <>
      {/* Desktop: full 3-button toggle */}
      <div className="hidden sm:flex bg-surface-container-high rounded-full p-0.5 border border-outline-variant/30">
        {THEMES.map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`p-1 rounded-full flex items-center justify-center transition-colors ${
              currentTheme === t
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:text-primary"
            }`}
            title={t === "light" ? "Modo Claro" : t === "dark" ? "Modo Oscuro" : "Tema del Sistema"}
          >
            <span className="material-symbols-outlined text-[18px]">{ICONS[t]}</span>
          </button>
        ))}
      </div>

      {/* Mobile: single icon button that cycles */}
      <button
        onClick={cycleTheme}
        className="sm:hidden p-1.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center"
        title={`Tema: ${currentTheme}`}
      >
        <span className="material-symbols-outlined text-[20px]">{ICONS[currentTheme]}</span>
      </button>
    </>
  );
}
