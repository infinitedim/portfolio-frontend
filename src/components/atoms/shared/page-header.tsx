import type { JSX, ReactNode } from "react";

interface PageHeaderProps {
                                                                                         
  title: string;
                                                              
  description?: string;
                                                                           
  actions?: ReactNode;
                                                                                           
  children?: ReactNode;
                                                
  className?: string;
}

   
                                                                 
                                                                           
                                    
   
export function PageHeader({
  title,
  description,
  actions,
  children,
  className = "",
}: PageHeaderProps): JSX.Element {
  const normalizedTitle = title.toLowerCase();

  return (
    <header className={`mb-8 text-left ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-mono text-3xl font-bold tracking-tight text-(--terminal-text) sm:text-4xl md:text-5xl">
          <span className="text-(--terminal-accent)">~/</span>
          {normalizedTitle}
        </h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {description && (
        <p className="mt-3 max-w-3xl font-mono text-base leading-relaxed text-(--terminal-muted) sm:text-lg">
          {description}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
