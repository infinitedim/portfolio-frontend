"use client";

import * as React from "react";
import { useMountRef } from "./hooks-utils";

/**
 * Type definition for custom interactive action elements passed to toast notifications.
 */
export type ToastActionElement = React.ReactElement;

/**
 * Configuration options and properties for displaying a toast notification.
 *
 * @interface ToastProps
 * @property {string} [id] - Optional unique identifier for the toast.
 * @property {React.ReactNode} [title] - Header or title content displayed inside the toast.
 * @property {React.ReactNode} [description] - Detailed message or body content of the toast.
 * @property {ToastActionElement} [action] - Interactive action button or component rendered in the toast.
 * @property {"default" | "destructive"} [variant] - Visual style variant for standard or destructive/error states.
 * @property {number} [duration] - Auto-dismiss timeout duration in milliseconds.
 * @property {boolean} [open] - Controlled visibility state of the toast.
 * @property {(open: boolean) => void} [onOpenChange] - Callback invoked when the open/closed state changes.
 */
export interface ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Maximum number of toasts permitted to be displayed on screen simultaneously.
 */
const TOAST_LIMIT = 1;

/**
 * Delay in milliseconds before dismissed toasts are completely purged from memory.
 */
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Representation of an instantiated toast item stored in the state queue.
 */
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/**
 * Constant enumeration of supported toast action types for state transitions.
 */
export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/**
 * Type alias representing the enumeration of action type keys.
 */
type ActionType = typeof actionTypes;

/**
 * Discriminated union of action objects dispatched to the toast reducer.
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

/**
 * State structure containing the current list of toast notifications.
 *
 * @interface State
 * @property {ToasterToast[]} toasts - Array of active toast notification objects.
 */
interface State {
  toasts: ToasterToast[];
}

/**
 * Singleton state manager responsible for coordinating toast notifications,
 * dispatching state transitions, handling removal timers, and managing subscriber listeners.
 */
class ToastManager {
  private listeners = new Set<(state: State) => void>();
  private state: State = { toasts: [] };
  private toastTimeouts = new Map<string, NodeJS.Timeout>();
  private idCounter = 0;

  /**
   * Generates a safe, incremental string identifier for a new toast notification.
   *
   * @returns {string} Unique string identifier.
   */
  genId(): string {
    this.idCounter = (this.idCounter + 1) % Number.MAX_SAFE_INTEGER;
    return this.idCounter.toString();
  }

  /**
   * Queues a toast for removal after the configured delay timeout.
   *
   * @param {string} toastId - The ID of the toast to be removed.
   */
  addToRemoveQueue(toastId: string) {
    if (this.toastTimeouts.has(toastId)) {
      return;
    }

    const timeout = setTimeout(() => {
      this.toastTimeouts.delete(toastId);
      this.dispatch({
        type: "REMOVE_TOAST",
        toastId: toastId,
      });
    }, TOAST_REMOVE_DELAY);

    this.toastTimeouts.set(toastId, timeout);
  }

  /**
   * Cancels and removes any pending removal timer for the specified toast ID.
   *
   * @param {string} toastId - The ID of the toast whose removal timer should be cleared.
   */
  removeFromQueue(toastId: string) {
    const timeout = this.toastTimeouts.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(toastId);
    }
  }

  /**
   * Pure state reducer function determining next toast state based on dispatched action.
   *
   * @param {State} state - The current toast state snapshot.
   * @param {Action} action - The action triggering the state transition.
   * @returns {State} The newly computed state snapshot.
   */
  reducer(state: State, action: Action): State {
    switch (action.type) {
      case "ADD_TOAST":
        return {
          ...state,
          toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
        };

      case "UPDATE_TOAST":
        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === action.toast.id ? { ...t, ...action.toast } : t,
          ),
        };

      case "DISMISS_TOAST": {
        const { toastId } = action;

        if (toastId) {
          this.removeFromQueue(toastId);
          this.addToRemoveQueue(toastId);
        } else {
          state.toasts.forEach((toast) => {
            this.removeFromQueue(toast.id);
            this.addToRemoveQueue(toast.id);
          });
        }

        return {
          ...state,
          toasts: state.toasts.map((t) =>
            t.id === toastId || toastId === undefined
              ? {
                  ...t,
                  open: false,
                }
              : t,
          ),
        };
      }
      case "REMOVE_TOAST":
        if (action.toastId === undefined) {
          this.toastTimeouts.forEach((timeout) => clearTimeout(timeout));
          this.toastTimeouts.clear();
          return {
            ...state,
            toasts: [],
          };
        }
        this.removeFromQueue(action.toastId);
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        };
    }
  }

  /**
   * Dispatches an action to update internal state and notifies all registered subscribers.
   *
   * @param {Action} action - The action to dispatch.
   */
  dispatch(action: Action) {
    this.state = this.reducer(this.state, action);
    this.listeners.forEach((listener) => {
      listener(this.state);
    });
  }

  /**
   * Subscribes a listener callback to state change notifications.
   *
   * @param {(state: State) => void} listener - Callback invoked on state changes.
   * @returns {() => void} Unsubscribe function to detach the listener.
   */
  subscribe(listener: (state: State) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Retrieves the current snapshot of toast state.
   *
   * @returns {State} Current state object.
   */
  getState() {
    return this.state;
  }

  /**
   * Cleans up all active timeouts and listener subscriptions.
   */
  cleanup() {
    this.toastTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.toastTimeouts.clear();
    this.listeners.clear();
  }
}

/**
 * Module-scoped variable holding the singleton `ToastManager` instance.
 */
let toastManager: ToastManager;

/**
 * Retrieves or initializes the singleton `ToastManager` instance.
 *
 * @returns {ToastManager} The singleton toast manager.
 */
function getToastManager(): ToastManager {
  if (!toastManager) {
    toastManager = new ToastManager();
  }
  return toastManager;
}

/**
 * Toast state reducer function exported for external state transitions.
 *
 * @param {State} state - The current state.
 * @param {Action} action - The action being applied.
 * @returns {State} The resulting next state.
 */
export const reducer = (state: State, action: Action): State => {
  return getToastManager().reducer(state, action);
};

/**
 * Dispatches a toast action to the singleton `ToastManager`.
 *
 * @param {Action} action - The action to dispatch.
 */
function dispatch(action: Action) {
  getToastManager().dispatch(action);
}

/**
 * Input properties for creating a new toast notification (excluding auto-generated `id`).
 */
type Toast = Omit<ToasterToast, "id">;

/**
 * Programmatically triggers a toast notification to appear in the UI.
 *
 * @param {Toast} props - Configuration options for the toast.
 * @returns {{ id: string; dismiss: () => void; update: (props: ToasterToast) => void }}
 * An object containing the toast's `id`, a `dismiss` function, and an `update` function.
 *
 * @example
 * ```tsx
 * const { id, dismiss } = toast({
 *   title: "Success",
 *   description: "Operation completed successfully.",
 * });
 * ```
 */
function toast(props: Toast) {
  const manager = getToastManager();
  const id = manager.genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * Custom React hook for consuming and controlling toast notifications in components.
 * Subscribes to the toast manager singleton and re-renders when state updates.
 *
 * @returns {{ toasts: ToasterToast[]; toast: typeof toast; dismiss: (toastId?: string) => void }}
 * An object containing the active toasts array, the `toast` function, and a `dismiss` function.
 *
 * @example
 * ```tsx
 * const { toasts, toast, dismiss } = useToast();
 * ```
 */
function useToast() {
  const manager = getToastManager();
  const isMountedRef = useMountRef();
  const [state, setState] = React.useState<State>(() => manager.getState());

  React.useEffect(() => {
    if (!isMountedRef.current) return;

    const isMounted = isMountedRef.current;

    const unsubscribe = manager.subscribe((newState) => {
      if (isMountedRef.current) {
        setState(newState);
      }
    });

    setState(manager.getState());

    return () => {
      unsubscribe();
      if (!isMounted) {
        setTimeout(() => {
          if (manager.getState().toasts.length === 0) {
            manager.cleanup();
          }
        }, 100);
      }
    };
  }, [manager, isMountedRef]);

  React.useEffect(() => {
    const handleBeforeUnload = () => {
      manager.cleanup();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const currentToasts = manager.getState().toasts;
        if (currentToasts.length === 0) {
          manager.cleanup();
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    }

    return undefined;
  }, [manager]);

  return React.useMemo(
    () => ({
      ...state,
      toast,
      dismiss: (toastId?: string) =>
        dispatch({ type: "DISMISS_TOAST", toastId }),
    }),
    [state],
  );
}

export { useToast, toast };
