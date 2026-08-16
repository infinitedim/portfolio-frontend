import * as React from "react";
import { cn } from "@/lib/utils/utils";

export type InputProps = React.ComponentProps<"input">;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-(--terminal-border) bg-black/40 px-3 py-1 text-xs text-(--terminal-text) font-mono shadow-sm transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-(--terminal-muted) focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--terminal-accent) disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
