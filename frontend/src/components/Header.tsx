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
    <header className="sticky top-0 z-30">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 shadow-[0_16px_50px_var(--shadow-soft)] backdrop-blur-xl">
          <a className="flex min-w-0 items-center gap-3" href="#studio">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent)] text-[color:var(--accent-contrast)]">
              <span className="text-sm font-semibold tracking-[-0.04em]">VF</span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-[0.16em] text-[color:var(--text-primary)] uppercase">
                VoiceForge
              </span>
              <span className="hidden text-xs text-[color:var(--text-muted)] sm:block">
                Public Kokoro studio for fast, natural speech
              </span>
            </span>
          </a>

          <nav
            aria-label="Secondary"
            className="flex items-center gap-2 text-sm text-[color:var(--text-muted)] sm:gap-3"
          >
            <a
              className="rounded-full px-3 py-2 transition hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
              href="#studio"
            >
              Studio
            </a>
            <a
              className="rounded-full px-3 py-2 transition hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
              href="#help"
            >
              Guide
            </a>
            <a
              className="hidden rounded-full px-3 py-2 transition hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)] sm:inline-flex"
              href="#history"
            >
              Recent
            </a>
            <button
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
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
        </div>
      </div>
    </header>
  );
}
