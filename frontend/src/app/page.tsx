import { Header } from "@/components/Header";
import { VoiceForgeShell } from "@/components/VoiceForgeShell";

export default function Home() {
  return (
    <div className="min-h-screen text-[color:var(--text-primary)]">
      <Header />

      <main
        className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-2 sm:px-6 sm:pb-24"
        id="studio"
      >
        <section className="relative overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-5 py-6 shadow-[0_28px_90px_var(--shadow-soft)] backdrop-blur-xl sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-8%] top-[-18%] h-52 w-52 rounded-full bg-[color:var(--hero-glow)] blur-3xl" />
            <div className="absolute bottom-[-24%] right-[-10%] h-60 w-60 rounded-full bg-[color:var(--hero-glow-strong)] blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-[color:var(--border)]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-end">
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5">
                  Public
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5">
                  No login
                </span>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5">
                  Kokoro-ready
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-balance text-5xl tracking-[-0.05em] text-[color:var(--text-primary)] sm:text-6xl">
                  Natural text-to-speech, shaped like a studio instead of a dashboard.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[color:var(--text-muted)] sm:text-lg">
                  Paste text, let the app detect the language, tune tone and
                  delivery, then render speech with a public Kokoro workflow
                  designed to stay fast and reliable in production.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-[color:var(--accent-contrast)] transition hover:opacity-90"
                  href="#studio"
                >
                  Open the studio
                </a>
                <a
                  className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-3 text-sm text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-elevated)] hover:text-[color:var(--text-primary)]"
                  href="#help"
                >
                  See the workflow
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                    Voice curation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    Small, intentional presets instead of a long provider dump.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                    Production flow
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    Better warmup, caching, and safer retries for real traffic.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                    Instant access
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    Open the page, generate, listen, and download without setup.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                  Live workflow
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">
                      1. Paste and detect
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
                      Language and tone suggestions keep the first render easy.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">
                      2. Tune the delivery
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
                      Voice, pitch, pauses, and expressiveness stay within safe ranges.
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">
                      3. Generate and reuse
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
                      Playback, download, and recent history are always one step away.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
                  What changed
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
                  The interface is now more guided, more legible, and better at
                  surfacing what will happen before you render.
                </p>
              </div>
            </div>
          </div>
        </section>

        <VoiceForgeShell />

        <section className="grid gap-4 lg:grid-cols-3" id="help">
          <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
              Write for speech
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-muted)]">
              Keep punctuation, sentence breaks, and names clean. A little structure
              makes the rendered phrasing sound noticeably better.
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
              Trust the defaults
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-muted)]">
              The first render is tuned to work well without micromanaging every
              control, so most clips can stay close to the center settings.
            </p>
          </div>
          <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-5">
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-faint)]">
              Re-render intentionally
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--text-muted)]">
              If you change text or controls after a render, the studio clearly marks
              the audio as stale so production exports stay trustworthy.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
