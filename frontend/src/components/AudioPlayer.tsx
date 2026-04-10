"use client";

import { useState } from "react";
import { Download, Link2, Volume2 } from "lucide-react";
import { toast } from "sonner";

import type { HistoryRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

import { SectionCard } from "./ui/SectionCard";
import { StatusPill } from "./ui/StatusPill";

type AudioPlayerProps = {
  record: HistoryRecord | null;
  onCopyUrl: (url: string) => void;
};

export function AudioPlayer({ record, onCopyUrl }: AudioPlayerProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!record?.audioUrl) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(record.audioUrl);

      if (!response.ok) {
        throw new Error("Audio download failed.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      const extension = response.headers.get("content-type")?.includes("wav")
        ? "wav"
        : "mp3";

      downloadLink.href = objectUrl;
      downloadLink.download = `voiceforge-${record.id}.${extension}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Audio download failed."
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <SectionCard className="overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-200/80">
            Latest Output
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Preview, replay, and export the generated audio
          </h2>
        </div>

        {record ? <StatusPill status={record.status} /> : null}
      </div>

      {!record ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
          Generate speech to populate the audio player and download controls.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Volume2 className="h-4 w-4" />
              <span>
                {record.voice} • {record.language}
              </span>
            </div>

            {record.audioUrl ? (
              <audio
                key={record.id}
                className="mt-4 w-full"
                controls
                preload="metadata"
                src={record.audioUrl}
              />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              disabled={!record.audioUrl}
              onClick={() => record.audioUrl && onCopyUrl(record.audioUrl)}
              type="button"
            >
              <Link2 className="h-4 w-4" />
              Copy audio URL
            </button>

            <button
              className="inline-flex items-center gap-2 rounded-full bg-teal-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              disabled={!record.audioUrl || isDownloading}
              onClick={handleDownload}
              type="button"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Preparing download..." : "Download file"}
            </button>
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300 sm:grid-cols-2">
            <p>Generated: {formatTimestamp(record.createdAt)}</p>
            <p>Provider: {record.provider}</p>
            {record.errorMessage ? <p className="text-rose-200">Error: {record.errorMessage}</p> : null}
            <p className="sm:col-span-2">{record.text}</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
