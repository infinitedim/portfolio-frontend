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

const CursorContext = createContext<CursorContextValue | null>(null);

export interface CursorProviderProps {
  children: ReactNode;
}

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

export function useCursor(): CursorContextValue {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursor must be used within a CursorProvider");
  }
  return context;
}
