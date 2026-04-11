"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "dark" | "light";

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const savedTheme = window.localStorage.getItem("voiceforge-theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function Header() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    document.documentElement.dataset.theme = preferredTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("voiceforge-theme", nextTheme);
  }

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
      <div className="text-sm text-[color:var(--text-secondary)]">
        <p className="font-medium tracking-[0.14em] text-[color:var(--text-primary)] uppercase">
          VoiceForge
        </p>
      </div>

      <nav
        aria-label="Secondary"
        className="flex items-center gap-4 text-sm text-[color:var(--text-muted)]"
      >
        <a className="transition hover:text-[color:var(--text-primary)]" href="#help">
          Help
        </a>
        <a
          className="transition hover:text-[color:var(--text-primary)]"
          href="#history"
        >
          Recent
        </a>
        <button
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)]"
          onClick={toggleTheme}
          type="button"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {theme === "dark" ? "Light" : "Dark"}
          </span>
        </button>
      </nav>
    </header>
  );
}
