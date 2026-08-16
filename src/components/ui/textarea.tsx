import * as React from "react";
import { cn } from "@/lib/utils/utils";

export type TextareaProps = React.ComponentProps<"textarea">;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-(--terminal-border) bg-black/40 px-3 py-2 text-xs text-(--terminal-text) font-mono shadow-sm placeholder:text-(--terminal-muted) focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--terminal-accent) disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
