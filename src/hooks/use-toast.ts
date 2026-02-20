"use client";

import * as React from "react";
import { useMountRef } from "./utils/hooks-utils";

export type ToastActionElement = React.ReactElement;
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

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

type ActionType = typeof actionTypes;

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

interface State {
  toasts: ToasterToast[];
}

class ToastManager {
  private listeners = new Set<(state: State) => void>();
  private state: State = { toasts: [] };
  private toastTimeouts = new Map<string, NodeJS.Timeout>();
  private idCounter = 0;

  genId(): string {
    this.idCounter = (this.idCounter + 1) % Number.MAX_SAFE_INTEGER;
    return this.idCounter.toString();
  }

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

  removeFromQueue(toastId: string) {
    const timeout = this.toastTimeouts.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(toastId);
    }
  }

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

  dispatch(action: Action) {
    this.state = this.reducer(this.state, action);
    this.listeners.forEach((listener) => {
      listener(this.state);
    });
  }

  subscribe(listener: (state: State) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  cleanup() {
    this.toastTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.toastTimeouts.clear();
    this.listeners.clear();
  }
}

let toastManager: ToastManager;

function getToastManager(): ToastManager {
  if (!toastManager) {
    toastManager = new ToastManager();
  }
  return toastManager;
}

export const reducer = (state: State, action: Action): State => {
  return getToastManager().reducer(state, action);
};

function dispatch(action: Action) {
  getToastManager().dispatch(action);
}

type Toast = Omit<ToasterToast, "id">;

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
