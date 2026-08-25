   
                                                            
   

export type CursorState = "default" | "hover" | "hide";

export type CursorTheme = "standard" | "terminal";

export interface CursorContextValue {
  cursorState: CursorState;
  cursorText: string | null;
  setCursorState: (state: CursorState, text?: string | null) => void;
  resetCursor: () => void;
}
