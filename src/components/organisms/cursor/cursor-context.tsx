"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CursorContextValue, CursorState } from "./cursor.types";

/**
 * React Context instance for providing and consuming custom cursor state and updater actions.
 */
const CursorContext = createContext<CursorContextValue | null>(null);

/**
 * Props interface for the {@link CursorProvider} component.
 */
export interface CursorProviderProps {
  /**
   * Child elements that will have access to the cursor context.
   */
  children: ReactNode;
}

/**
 * Provider component that manages cursor state, custom label/text, and exposes
 * updater and reset functions to all child components via React Context.
 *
 * @param props - The component props.
 * @param props.children - The subtree of components that consume cursor context.
 * @returns A JSX element wrapping children with the CursorContext provider.
 */
export function CursorProvider({ children }: CursorProviderProps) {
  const [cursorState, setCursorStateInternal] = useState<CursorState>("default");
  const [cursorText, setCursorText] = useState<string | null>(null);

  const setCursorState = useCallback((state: CursorState, text: string | null = null) => {
    setCursorStateInternal(state);
    setCursorText(text ?? null);
  }, []);

  const resetCursor = useCallback(() => {
    setCursorStateInternal("default");
    setCursorText(null);
  }, []);

  const value = useMemo(
    () => ({
      cursorState,
      cursorText,
      setCursorState,
      resetCursor,
    }),
    [cursorState, cursorText, setCursorState, resetCursor],
  );

  return <CursorContext.Provider value={value}>{children}</CursorContext.Provider>;
}

/**
 * Custom hook to access the current cursor context values and mutation functions.
 *
 * @description Hook that retrieves cursor state (hover, pointer, drag, etc.), associated text,
 * and dispatchers (`setCursorState`, `resetCursor`) from the nearest {@link CursorProvider}.
 *
 * @returns The current {@link CursorContextValue} object.
 * @throws {Error} When invoked outside of a {@link CursorProvider}.
 */
export function useCursor(): CursorContextValue {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursor must be used within a CursorProvider");
  }
  return context;
}

