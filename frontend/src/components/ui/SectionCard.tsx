import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = PropsWithChildren<{
  className?: string;
}>;

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-glow backdrop-blur",
        className
      )}
    >
      {children}
    </section>
  );
}
