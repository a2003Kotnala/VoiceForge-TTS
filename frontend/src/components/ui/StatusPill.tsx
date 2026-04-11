import { cn } from "@/lib/utils";

type StatusPillProps = {
  status: "processing" | "completed" | "failed";
};

const statusStyles: Record<StatusPillProps["status"], string> = {
  processing: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-300"
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  );
}
