   
                                     
  
                                                                               
                                                                                 
  
               
                                                                          
  
           
         
                                                                  
      
  
                
                                                                                    
                                                                                      
                                         
                 
                            
   

"use client";

import { type JSX } from "react";
import { CommandInput } from "@/components/molecules/terminal/command-input";
import { CommandLoadingIndicator } from "@/components/molecules/terminal/command-loading-indicator";
import { useTerminalContext } from "@/lib/context/terminal-context";
import { useI18n } from "@/hooks/use-i18n";

                                                          
const AVAILABLE_COMMANDS = [
  "help",
  "skills",
  "customize",
  "themes",
  "fonts",
  "status",
  "clear",
  "alias",
  "about",
  "contact",
  "projects",
  "roadmap",
  "progress",
  "theme",
  "font",
  "language",
  "demo",
  "github",
  "tech-stack",
  "resume",
  "social",
  "shortcuts",
  "easter-eggs",
  "pwa",
] as const;

   
                       
  
                                                                          
                                                                 
   
export function TerminalInputSection(): JSX.Element {
  const { t } = useI18n();
  const {
    currentInput,
    setCurrentInput,
    handleSubmit,
    isProcessing,
    navigateHistory,
    getCommandSuggestions,
    getFrequentCommands,
    commandInputRef,
  } = useTerminalContext();

  const loadingMessages = [
    t("termLoading1"),
    t("termLoading2"),
    t("termLoading3"),
    t("termLoading4"),
    t("termLoading5"),
  ];

  return (
    <div
      id="command-input"
      className="sticky bottom-0 py-2 command-input-container"
      style={{ backgroundColor: "transparent" }}
      suppressHydrationWarning={true}
      tabIndex={-1}
    >
                                                                        
      {isProcessing && (
        <CommandLoadingIndicator
          command={currentInput}
          visible={isProcessing}
          messages={loadingMessages}
        />
      )}

      <CommandInput
        value={currentInput}
        onChange={setCurrentInput}
        onSubmit={handleSubmit}
        onHistoryNavigate={navigateHistory}
        isProcessing={isProcessing}
        availableCommands={AVAILABLE_COMMANDS as unknown as string[]}
        inputRef={commandInputRef}
        getCommandSuggestions={getCommandSuggestions}
        getFrequentCommands={getFrequentCommands}
        showOnEmpty={false}
      />
    </div>
  );
}
