import { Header } from "@/components/Header";
import { VoiceForgeShell } from "@/components/VoiceForgeShell";

export default function Home() {
  return (
    <div className="min-h-screen text-[color:var(--text-primary)]">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-4 sm:px-6 sm:pb-24">
        <section className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-sm tracking-[0.18em] text-[color:var(--text-faint)] uppercase">
            Public TTS Tool
          </p>
          <h1 className="text-balance text-5xl tracking-[-0.04em] text-[color:var(--text-primary)] sm:text-6xl">
            Text to Speech
          </h1>
          <p className="mx-auto max-w-xl text-base leading-7 text-[color:var(--text-muted)] sm:text-lg">
            Convert text into natural speech. Free to use, open to everyone, and
            ready the moment the page loads.
          </p>
        </section>

        <VoiceForgeShell />

        <section
          className="mx-auto max-w-3xl rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-5 py-4 text-sm leading-7 text-[color:var(--text-muted)]"
          id="help"
        >
          Paste text, keep the detected language if it looks right, choose a
          voice and tone, then generate. The interface is intentionally public and
          login-free, so anyone can open it and use it immediately.
        </section>
      </main>
    </div>
  );
}
