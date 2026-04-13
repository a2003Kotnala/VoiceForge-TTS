import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = PropsWithChildren<
  {
    className?: string;
  } & HTMLAttributes<HTMLElement>
>;

export function SectionCard({
  children,
  className,
  ...props
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_24px_80px_var(--shadow-soft)] backdrop-blur-xl sm:p-6",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
