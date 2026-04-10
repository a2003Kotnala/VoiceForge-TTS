import { Navbar } from "@/components/Navbar";
import { VoiceForgeShell } from "@/components/VoiceForgeShell";

const highlights = [
  "Secure backend-only provider credentials",
  "Playback, download, and recent history out of the box",
  "Render + Vercel deployment flow with typed env handling"
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.22),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.22),_transparent_38%)]" />
      <div className="pointer-events-none absolute left-1/2 top-72 h-80 w-80 -translate-x-1/2 rounded-full bg-teal-300/20 blur-3xl" />

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24">
        <section className="grid gap-10 pb-12 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pb-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-teal-800">
              Text To Speech, Fully Shippable
            </p>
            <h1 className="mt-6 max-w-3xl font-display text-5xl leading-tight text-slate-950 md:text-6xl">
              Build expressive voice output without exposing secrets to the browser.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              VoiceForge pairs a polished Next.js frontend with a
              provider-abstracted Express backend, persistent generation history,
              and deployable configs for Vercel and Render.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                href="#studio"
              >
                Open the studio
              </a>
              <a
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-950"
                href="#history"
              >
                Review recent generations
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/70 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid gap-4">
              {highlights.map((highlight) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700"
                  key={highlight}
                >
                  {highlight}
                </div>
              ))}
            </div>
          </div>
        </section>

        <VoiceForgeShell />
      </main>
    </div>
  );
}
