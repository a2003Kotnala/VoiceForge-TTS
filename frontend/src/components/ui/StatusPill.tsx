import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: "processing" | "completed" | "failed";
};

const statusStyles: Record<StatusPillProps["status"], string> = {
  processing: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  completed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  failed: "border-rose-400/30 bg-rose-400/10 text-rose-100"
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
