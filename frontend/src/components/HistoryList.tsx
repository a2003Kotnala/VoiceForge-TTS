"use client";

import type { HistoryRecord } from "@/lib/types";
import {
  formatEmotionLabel,
  formatLanguageLabel,
  formatTimestamp
} from "@/lib/utils";

import { SectionCard } from "./ui/SectionCard";
import { StatusPill } from "./ui/StatusPill";

type HistoryListProps = {
  items: HistoryRecord[];
  activeId?: string;
  isLoading: boolean;
  onSelect: (record: HistoryRecord) => void;
};

export function HistoryList({
  items,
  activeId,
  isLoading,
  onSelect
}: HistoryListProps) {
  return (
    <SectionCard className="space-y-4" id="history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[color:var(--text-primary)]">
            Recent generations
          </p>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">
            Open an earlier render to reuse it or download it again.
          </p>
        </div>
        <p className="text-xs text-[color:var(--text-subtle)]">
          {isLoading ? "Refreshing..." : `${items.length} saved`}
        </p>
      </div>

      {!items.length ? (
        <div className="rounded-[1.3rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 text-sm text-[color:var(--text-subtle)]">
          Generated clips will appear here.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {items.map((item) => {
            const isActive = item.id === activeId;

            return (
              <button
                className={[
                  "rounded-[1.3rem] border p-4 text-left transition",
                  isActive
                    ? "border-[color:var(--border-strong)] bg-[color:var(--surface-elevated)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-elevated)]"
                ].join(" ")}
                key={item.id}
                onClick={() => onSelect(item)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[color:var(--text-primary)]">
                      {item.voiceLabel ?? item.voice}
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--text-subtle)]">
                      {formatLanguageLabel(item.language)} /{" "}
                      {formatEmotionLabel(item.emotion)}
                    </p>
                  </div>
                  <StatusPill status={item.status} />
                </div>

                <p className="mt-3 max-h-[4.8rem] overflow-hidden text-sm leading-6 text-[color:var(--text-muted)]">
                  {item.text}
                </p>
                <p className="mt-3 text-xs text-[color:var(--text-faint)]">
                  {formatTimestamp(item.createdAt)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
