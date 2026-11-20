import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-[#16182ee6] text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}
