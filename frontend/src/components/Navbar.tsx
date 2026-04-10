export function Navbar() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-200/80">
          VoiceForge
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Production-ready text to speech, from prompt to download.
        </p>
      </div>

      <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
        <a className="transition hover:text-white" href="#studio">
          Studio
        </a>
        <a className="transition hover:text-white" href="#history">
          History
        </a>
      </nav>
    </header>
  );
}
