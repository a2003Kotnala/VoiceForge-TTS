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
        "rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_18px_60px_var(--shadow-soft)] backdrop-blur-sm sm:p-6",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
