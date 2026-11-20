import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-full border border-white/10 bg-[#14172cf2] px-4 text-sm text-white outline-none placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-[#6d4dff]",
        className,
      )}
      {...props}
    />
  );
}
