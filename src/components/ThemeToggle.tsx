"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/30 ml-4">
      <button
        onClick={() => setTheme("light")}
        className={`p-1 rounded-full flex items-center justify-center transition-colors ${
          theme === "light"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface-variant hover:text-primary"
        }`}
        title="Modo Claro"
      >
        <span className="material-symbols-outlined text-[18px]">light_mode</span>
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1 rounded-full flex items-center justify-center transition-colors ${
          theme === "system"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface-variant hover:text-primary"
        }`}
        title="Tema del Sistema"
      >
        <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1 rounded-full flex items-center justify-center transition-colors ${
          theme === "dark"
            ? "bg-primary text-on-primary shadow-sm"
            : "text-on-surface-variant hover:text-primary"
        }`}
        title="Modo Oscuro"
      >
        <span className="material-symbols-outlined text-[18px]">dark_mode</span>
      </button>
    </div>
  );
}
