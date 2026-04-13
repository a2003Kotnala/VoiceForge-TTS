"use client";

import type { HistoryRecord } from "@/lib/types";
import {
  formatEmotionLabel,
  formatLanguageLabel,
  formatTimestamp
} from "@/lib/utils";

type AudioPlayerProps = {
  record: HistoryRecord | null;
  hasPendingChanges: boolean;
};

export function AudioPlayer({
  record,
  hasPendingChanges
}: AudioPlayerProps) {
  const model = typeof record?.metadata?.model === "string" ? record.metadata.model : null;
  const cacheHit =
    typeof record?.metadata?.cacheHit === "boolean" ? record.metadata.cacheHit : false;
  const summary = record
    ? [
        formatLanguageLabel(record.language),
        formatEmotionLabel(record.emotion),
        record.voiceLabel ?? record.voice
      ].join(" / ")
    : null;

  return (
    <section className="space-y-4 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[color:var(--text-primary)]">
              Playback
            </p>
            <p className="text-sm text-[color:var(--text-muted)]">
              Listen to the latest generated result with the browser audio controls.
            </p>
          </div>
          {record ? (
            <p className="text-xs text-[color:var(--text-subtle)]">
              {formatTimestamp(record.createdAt)}
            </p>
          ) : null}
        </div>

        {summary ? (
          <p className="text-xs text-[color:var(--text-subtle)]">{summary}</p>
        ) : null}
      </div>

      {!record?.audioUrl ? (
        <div className="rounded-[1.3rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 text-sm text-[color:var(--text-subtle)]">
          Generate speech and the audio player will appear here.
        </div>
      ) : (
        <div className="space-y-3 rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
          <audio
            className="h-12 w-full"
            controls
            playsInline
            preload="metadata"
            src={record.audioUrl}
          />
          <p className="text-xs text-[color:var(--text-subtle)]">
            If the browser blocks autoplay, press play directly in the control bar.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-[color:var(--text-subtle)]">
            {model ? (
              <span className="rounded-full border border-[color:var(--border)] px-3 py-1">
                {model}
              </span>
            ) : null}
            {cacheHit ? (
              <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                Served from cache
              </span>
            ) : null}
          </div>
        </div>
      )}

      {hasPendingChanges ? (
        <p className="text-xs text-amber-300">
          The text changed after the last render, so the audio above no longer
          matches. Generate again to hear the updated version.
        </p>
      ) : null}
    </section>
  );
}
