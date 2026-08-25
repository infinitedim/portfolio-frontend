"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Props for the {@link ConfirmDialog} component.
 *
 * @interface ConfirmDialogProps
 * @property {boolean} open - Controls whether the modal dialog is visible.
 * @property {(open: boolean) => void} onOpenChange - Callback invoked when the open state changes (e.g. dismissed or closed).
 * @property {string} title - The title header displayed in the dialog.
 * @property {string} description - Explanatory text providing context about the action being confirmed.
 * @property {string} [confirmLabel="Confirm"] - The label text for the primary confirmation button.
 * @property {string} [cancelLabel="Cancel"] - The label text for the cancellation button.
 * @property {"destructive" | "default" | "terminal-danger"} [variant="destructive"] - Visual variant determining button style and danger icon presentation.
 * @property {() => void | Promise<void>} onConfirm - Callback invoked when the user confirms the action. Supports async operations.
 * @property {boolean} [isLoading=false] - External loading state flag to disable buttons and show progress text.
 */
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default" | "terminal-danger";
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
}

/**
 * A modal confirmation dialog component used to confirm critical or destructive actions.
 *
 * Displays a modal dialog with a title, description, optional danger indicator icon,
 * and cancel/confirm buttons with built-in async execution loading states.
 *
 * @component
 * @param {ConfirmDialogProps} props - The props configuring the confirmation dialog.
 * @returns {React.JSX.Element} The rendered confirmation dialog component.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps): React.JSX.Element {
  const [loading, setLoading] = React.useState(false);

  /**
   * Handles the confirmation trigger, managing local loading state and dismissing the dialog on completion.
   *
   * @returns {Promise<void>} Resolves when the confirmation handler and state cleanup complete.
   */
  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isBusy = isLoading || loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0">
          {variant === "destructive" || variant === "terminal-danger" ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
            <DialogDescription className="mt-1 text-xs">{description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={handleConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
