import { Download, Loader2 } from "lucide-react";

type ActionBarProps = {
  isGenerating: boolean;
  canDownload: boolean;
  hasAudio: boolean;
  hasPendingChanges: boolean;
  onGenerate: () => void;
  onDownload: () => void;
};

export function ActionBar({
  isGenerating,
  canDownload,
  hasAudio,
  hasPendingChanges,
  onGenerate,
  onDownload
}: ActionBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.4rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-4 py-2.5 text-sm font-medium text-[color:var(--accent-contrast)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isGenerating}
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
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-2.5 text-sm text-[color:var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
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
