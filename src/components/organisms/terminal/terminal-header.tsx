   
                               
  
                                                                            
                                                                        
  
               
                                                                          
  
           
         
                     
      
  
                
                                                      
                                                    
                
                       
   

"use client";

import { type JSX } from "react";
import { ASCIIBanner } from "@/components/molecules/shared/ascii-banner";
import { InteractiveWelcome } from "@/components/molecules/shared/interactive-welcome";
import { useTerminalContext } from "@/lib/context/terminal-context";

   
                 
  
                                                                                                     
   
export function TerminalHeader(): JSX.Element {
  const { showWelcome, setShowWelcome, handleWelcomeCommandSelect, history } =
    useTerminalContext();

  return (
    <div>
                                           
      <div className="mb-4 sm:mb-8">
        <ASCIIBanner />
      </div>

                                                             
      {showWelcome && history.length === 0 && (
        <InteractiveWelcome
          onCommandSelect={handleWelcomeCommandSelect}
          onDismiss={() => setShowWelcome(false)}
        />
      )}
    </div>
  );
}
