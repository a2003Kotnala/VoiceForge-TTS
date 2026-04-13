import type { VoiceOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type VoiceSelectorProps = {
  voices: VoiceOption[];
  selectedVoice: string;
  onVoiceChange: (value: string) => void;
};

export function VoiceSelector({
  voices,
  selectedVoice,
  onVoiceChange
}: VoiceSelectorProps) {
  return (
    <aside className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-[color:var(--text-primary)]">Voice</p>
        <p className="text-sm leading-6 text-[color:var(--text-muted)]">
          Choose the voice style you want to hear. The list stays curated so the
          first choice feels confident instead of overwhelming.
        </p>
      </div>

      <div className="space-y-3">
        {voices.map((voice) => {
          const isActive = voice.id === selectedVoice;

          return (
            <button
              aria-pressed={isActive}
              className={cn(
                "w-full rounded-[1.45rem] border p-4 text-left transition",
                isActive
                  ? "border-[color:var(--border-strong)] bg-[color:var(--surface-elevated)] shadow-[0_16px_45px_var(--shadow-soft)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-elevated)]"
              )}
              key={voice.id}
              onClick={() => onVoiceChange(voice.id)}
              type="button"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--text-subtle)]">
                <span className="rounded-full border border-[color:var(--border)] px-2 py-1">
                  {voice.accentLabel ?? voice.languages[0]}
                </span>
                <span className="rounded-full border border-[color:var(--border)] px-2 py-1">
                  {voice.presentation}
                </span>
                {voice.quality ? (
                  <span className="rounded-full border border-[color:var(--border)] px-2 py-1">
                    {voice.quality}
                  </span>
                ) : null}
                {voice.recommended ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-200">
                    Default
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-sm font-medium text-[color:var(--text-primary)]">
                {voice.displayName}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                {voice.description}
              </p>
            </button>
          );
        })}

        {!voices.length ? (
          <div className="rounded-[1.4rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
            Voice styles will appear once a supported language is selected.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
