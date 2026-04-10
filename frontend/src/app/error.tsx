"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-800">
        Something broke
      </p>
      <h1 className="mt-4 font-display text-4xl text-slate-950">
        VoiceForge hit an unexpected frontend error.
      </h1>
      <p className="mt-4 text-slate-700">{error.message}</p>
      <button
        className="mt-8 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white"
        onClick={() => reset()}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}
