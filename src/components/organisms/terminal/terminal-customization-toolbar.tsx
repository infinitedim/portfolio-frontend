   
                                             
  
                                                                           
                                                     
  
               
                                                                          
                                                                                
  
           
         
                                   
      
  
                
                                                         
                        
                         
                      
   

"use client";

import { useState, useEffect, type JSX } from "react";
import { CustomizationButton } from "@/components/molecules/customization/customization-button";
import { CustomizationManager } from "@/components/organisms/customization/customization-manager";
import { NotificationToast } from "@/components/molecules/shared/notification-toast";
import { useTerminalContext } from "@/lib/context/terminal-context";

   
                               
  
                                                                       
                                                                        
                                            
   
export function TerminalCustomizationToolbar(): JSX.Element {
  const { notification, clearNotification } = useTerminalContext();

  const [isOpen, setIsOpen] = useState(false);

     
                                                                        
                                                                           
                                                        
     
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener("terminal:open-customization", handleOpenEvent);
    return () =>
      window.removeEventListener(
        "terminal:open-customization",
        handleOpenEvent,
      );
  }, []);

  return (
    <>
                                           
      <div
        id="customization"
        tabIndex={-1}
      >
        <CustomizationButton />
      </div>

                                              
      <CustomizationManager
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

                                
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={clearNotification}
        />
      )}
    </>
  );
}
