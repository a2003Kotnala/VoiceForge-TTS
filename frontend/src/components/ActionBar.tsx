import { Download, Loader2 } from "lucide-react";

type ActionBarProps = {
  isGenerating: boolean;
  canGenerate: boolean;
  canDownload: boolean;
  hasAudio: boolean;
  hasPendingChanges: boolean;
  estimatedDuration: string;
  selectedVoiceLabel: string | null;
  onGenerate: () => void;
  onDownload: () => void;
};

export function ActionBar({
  isGenerating,
  canGenerate,
  canDownload,
  hasAudio,
  hasPendingChanges,
  estimatedDuration,
  selectedVoiceLabel,
  onGenerate,
  onDownload
}: ActionBarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[color:var(--text-primary)]">
            Render controls
          </p>
          <p className="text-sm text-[color:var(--text-muted)]">
            {selectedVoiceLabel
              ? `${selectedVoiceLabel} selected`
              : "Choose a voice to unlock generation."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-[color:var(--text-subtle)]">
          <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5">
            {estimatedDuration} live estimate
          </span>
          {hasPendingChanges ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-amber-200">
              Audio needs refresh
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-[color:var(--accent-contrast)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canGenerate || isGenerating}
          onClick={onGenerate}
          type="button"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Generate Speech</>
          )}
        </button>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-3 text-sm text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canDownload}
          onClick={onDownload}
          type="button"
        >
          <Download className="h-4 w-4" />
          Download Audio
        </button>
      </div>

      <p className="text-xs text-[color:var(--text-subtle)]">
        {hasPendingChanges
          ? "The text or settings changed since the last render. Generate again to refresh the audio below."
          : hasAudio
            ? "Playback is ready in the audio section above, and the file can be downloaded any time."
            : "Generate speech once and the audio player plus download action will unlock."}
      </p>
    </div>
  );
}
