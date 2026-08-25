   
                                                               
  
                                                                 
                                       
   

import type { MutableRefObject } from "react";
import type { ThemeName, ThemeConfig } from "@/types/theme";
import type { FontName, FontConfig } from "@/types/font";
import type { CommandOutput, TerminalHistory } from "@/types/terminal";
import type { BackgroundSettings } from "@/types/customization";
import type { TranslationKeys } from "@/lib/i18n/interfaces";

                                                                              
               
                                                                              

export interface TerminalNotification {
  message: string;
  type: "info" | "success" | "warning" | "error";
}

                                                                              
                                              
                                                                              

export interface ThemePerformance {
  getPerformanceReport: () => {
    totalSwitches: number;
    averageTime: number;
    fastestSwitch: number;
    slowestSwitch: number;
    themeUsage: Record<ThemeName, number>;
  };
  themeMetrics: {
    switchCount: number;
    averageSwitchTime: number;
    lastSwitchTime: number;
    popularThemes: { theme: ThemeName; count: number }[];
    renderTime: number;
  };
  resetMetrics: () => void;
}

                                                                              
                    
                                                                              

export interface TerminalContextType {
                                                                            
                                                            
  history: TerminalHistory[];

                                                 
  currentInput: string;

                                       
  setCurrentInput: (value: string | ((prev: string) => string)) => void;

                                                
  isProcessing: boolean;

                                                           
  isClearing?: boolean;

     
                                                                           
                                                                              
     
  executeCommand: (input: string) => Promise<CommandOutput | null>;

                                                              
  addToHistory: (input: string, output: CommandOutput) => void;

                                                                               
  navigateHistory: (direction: "up" | "down") => string;

                                                            
  clearHistory: () => void;

                                                                 
  getCommandSuggestions: (input: string, limit?: number) => string[];

                                             
  getFrequentCommands: () => string[];

                                                                  
  commandAnalytics: {
    totalCommands: number;
    uniqueCommands: number;
    successRate: number;
    topCommands: { command: string; count: number }[];
    commandsByCategory?: Record<string, number>;
  } | null;

                                                                            
                                                       
  theme: ThemeName;

                                                             
  themeConfig: ThemeConfig;

     
                             
                                                                 
     
  changeTheme: (newTheme: ThemeName) => boolean;

                                         
  availableThemes: ThemeName[];

                                          
  themeError: string | null;

                                                                
  mounted: boolean;

                                      
  themeMetrics: ThemePerformance["themeMetrics"];

                                                               
  getPerformanceReport: ThemePerformance["getPerformanceReport"];

                                                     
  resetPerformanceMetrics: () => void;

                                                                            
                          
  font: FontName;

                                                                  
  fontConfig: FontConfig;

     
                            
                                         
     
  changeFont: (newFont: FontName) => void;

                                 
  availableFonts: FontName[];

                                                                            
                                                
  t: (key: keyof TranslationKeys) => string;

                                                           
  currentLocale: string;

                                                                          
  changeLocale: (localeCode: string) => boolean;

                                                                            
                                                        
  announceMessage: (message: string, priority?: "polite" | "assertive") => void;

                                                                    
  isReducedMotion: boolean;

                                                                    
  isHighContrast: boolean;

                                           
  fontSize: "small" | "medium" | "large";

                                    
  setFontSize: (size: "small" | "medium" | "large") => void;

                                                      
  focusMode: boolean;

                                 
  setFocusMode: (enabled: boolean) => void;

                                                                            
                                                       
  backgroundSettings: BackgroundSettings;

                                             
  setBackgroundSettings: (settings: BackgroundSettings) => void;

                                                                            
                                                         
  showWelcome: boolean;

                                       
  setShowWelcome: (show: boolean) => void;

                                           
  notification: TerminalNotification | null;

     
                                            
                                     
                                                   
     
  showNotification: (
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ) => void;

                                         
  clearNotification: () => void;

                                                                            
     
                                  
                                                             
                                                                       
     
  handleSubmit: (command: string) => Promise<void>;

                                                                  
  handleWelcomeCommandSelect: (command: string) => void;

                                                                            
                                                                               
  commandInputRef: MutableRefObject<HTMLInputElement | null>;

                                                     
  terminalRef: MutableRefObject<HTMLDivElement | null>;

                                                                                
  bottomRef: MutableRefObject<HTMLDivElement | null>;
}
