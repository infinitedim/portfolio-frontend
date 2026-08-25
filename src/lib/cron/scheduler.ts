export interface RegisteredCronJob {
  name: string;
  expression: string;
  engineUsed: "bun-cron" | "fallback-interval";
  stop(): void;
}

interface BunCronGlobal {
  cron?(expression: string, callback: () => void): void;
}

   
                                                                    
                                                              
   
export function registerCronJob(
  expression: string,
  intervalMs: number,
  jobName: string,
  callback: () => void,
): RegisteredCronJob {
  const bunGlobal = (globalThis as unknown as Record<string, unknown>).Bun as
    | { cron?: BunCronGlobal["cron"] }
    | undefined;

                          
  if (bunGlobal && typeof bunGlobal.cron === "function") {
    try {
      bunGlobal.cron(expression, callback);
      return {
        name: jobName,
        expression,
        engineUsed: "bun-cron",
        stop() {
                                                
        },
      };
    } // eslint-disable-next-line no-empty
    catch {}
  }

                                     
  const timer = setInterval(() => {
    try {
      callback();
    } // eslint-disable-next-line no-empty
    catch {}
  }, intervalMs);

  return {
    name: jobName,
    expression,
    engineUsed: "fallback-interval",
    stop() {
      clearInterval(timer);
    },
  };
}
