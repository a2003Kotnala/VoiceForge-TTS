"use client";

import type { HistoryRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";

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
    <SectionCard className="h-full" >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-200/80">
            Recent History
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Keep track of your most recent generations
          </h2>
        </div>
        <p className="text-sm text-slate-400">{isLoading ? "Refreshing..." : `${items.length} item${items.length === 1 ? "" : "s"}`}</p>
      </div>

      <div className="mt-6 space-y-3" id="history">
        {!items.length ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Your successful and failed generations will appear here.
          </div>
        ) : null}

        {items.map((item) => (
          <button
            className={`w-full rounded-2xl border p-4 text-left transition ${
              item.id === activeId
                ? "border-teal-300/40 bg-teal-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            key={item.id}
            onClick={() => onSelect(item)}
            type="button"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{item.voice}</p>
                <p className="text-sm text-slate-400">
                  {item.language} • {formatTimestamp(item.createdAt)}
                </p>
              </div>
              <StatusPill status={item.status} />
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-slate-300">{item.text}</p>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
