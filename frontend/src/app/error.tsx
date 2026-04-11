"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#070b12] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
          <p className="text-sm font-medium text-white/50">Something went wrong</p>
          <h1 className="mt-3 text-3xl text-white">
            VoiceForge ran into an unexpected frontend error.
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/55">{error.message}</p>
          <button
            className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-medium text-[#09111c] transition hover:bg-white/90"
            onClick={() => reset()}
            type="button"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
