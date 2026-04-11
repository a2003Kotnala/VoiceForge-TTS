import type { EmotionDescriptor, EmotionOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type EmotionSelectorProps = {
  emotions: EmotionDescriptor[];
  selectedEmotion: EmotionOption;
  suggestedEmotion: EmotionOption | null;
  onChange: (value: EmotionOption) => void;
};

export function EmotionSelector({
  emotions,
  selectedEmotion,
  suggestedEmotion,
  onChange
}: EmotionSelectorProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-[color:var(--text-primary)]">How should this sound?</p>
        <p className="text-sm text-[color:var(--text-muted)]">
          Pick a tone, then adjust the finer controls only if you need them.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => {
          const isActive = emotion.id === selectedEmotion;

          return (
            <button
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition",
                isActive
                  ? "border-[color:var(--border-strong)] bg-[color:var(--surface-elevated)] text-[color:var(--text-primary)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)]"
              )}
              key={emotion.id}
              onClick={() => onChange(emotion.id)}
              type="button"
            >
              {emotion.label}
            </button>
          );
        })}
      </div>

      {suggestedEmotion ? (
        <p className="text-xs text-[color:var(--text-subtle)]">
          Suggested from the text:{" "}
          <span className="text-[color:var(--text-secondary)]">
            {emotions.find((emotion) => emotion.id === suggestedEmotion)?.label ??
              suggestedEmotion}
          </span>
        </p>
      ) : null}
    </section>
  );
}
