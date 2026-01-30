# Console.log to Structured Logger Migration Guide

Guide for migrating from console.log to the structured logging system.

## Overview

The codebase currently has 297+ instances of console.log/warn/error. This guide will help you migrate them to the structured logger.

## Migration Strategy

### Phase 1: Critical Paths (Week 1)

Migrate high-priority areas first:

- Error handlers
- Authentication flows
- Payment processing
- API routes

### Phase 2: Core Features (Week 2)

- User actions
- Data fetching
- Form submissions
- Navigation

### Phase 3: General Code (Week 3)

- Utility functions
- Helper methods
- Development-only logs

## Migration Patterns

### Pattern 1: Simple console.log

**Before**:

```typescript
console.log("User logged in");
```

**After**:

```typescript
import clientLogger from "@/lib/logger/client-logger";

clientLogger.info("User logged in", {
  component: "AuthService",
  action: "login",
});
```

### Pattern 2: console.log with variables

**Before**:

```typescript
console.log("Fetched users:", users.length);
```

**After**:

```typescript
logger.info(
  "Users fetched",
  {
    component: "UserService",
  },
  {
    count: users.length,
  },
);
```

### Pattern 3: console.error

**Before**:

```typescript
console.error("Failed to load data:", error);
```

**After**:

```typescript
logger.error("Failed to load data", error, {
  component: "DataLoader",
  action: "fetch",
});
```

### Pattern 4: console.warn

**Before**:

```typescript
console.warn("Deprecated method called");
```

**After**:

```typescript
logger.warn("Deprecated method called", {
  component: "LegacyService",
  method: "oldMethod",
});
```

### Pattern 5: Debug logs

**Before**:

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("Debug:", data);
}
```

**After**:

```typescript
logger.debug(
  "Debug data",
  {
    component: "MyComponent",
  },
  {
    data,
  },
);
```

### Pattern 6: Grouped console logs

**Before**:

```typescript
console.group("User Details");
console.log("Name:", user.name);
console.log("Email:", user.email);
console.groupEnd();
```

**After**:

```typescript
logger.info(
  "User details",
  {
    component: "UserProfile",
  },
  {
    name: user.name,
    email: maskPII(user.email),
  },
);
```

### Pattern 7: Performance logs

**Before**:

```typescript
console.time("fetch");
await fetchData();
console.timeEnd("fetch");
```

**After**:

```typescript
const startTime = Date.now();
await fetchData();
const duration = Date.now() - startTime;

clientLogger.logPerformance("fetch_data", duration, {
  operation: "fetchData",
});
```

## File-by-File Migration

### 1. Identify Component Context

Before migrating, identify:

- Component name
- Action being performed
- Relevant context

### 2. Import Logger

Add at the top of file:

```typescript
// Client-side
import clientLogger from "@/lib/logger/client-logger";

// Server-side
import { createServerLogger } from "@/lib/logger/server-logger";
const logger = createServerLogger("ComponentName");
```

### 3. Replace Logs

Go through each console.log and replace with appropriate logger method.

### 4. Test

Run the application and verify logs appear correctly.

## Automated Migration

### Using Find and Replace

**Step 1**: Find simple console.log patterns

```regex
console\.log\((.*?)\);
```

Replace with (manual review needed):

```typescript
logger.info($1, { component: "TODO" });
```

**Step 2**: Find console.error patterns

```regex
console\.error\((.*?),\s*(.*?)\);
```

Replace with:

```typescript
logger.error($1, $2, { component: "TODO" });
```

### Using Code Mod

Create a codemod script for automated migration:

```typescript
// scripts/migrate-console-logs.ts
import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";

const files = glob.sync("src/**/*.{ts,tsx}");

for (const file of files) {
  let content = readFileSync(file, "utf8");

  // Simple replacements
  content = content.replace(/console\.log\(/g, "logger.info(");

  content = content.replace(/console\.error\(/g, "logger.error(");

  content = content.replace(/console\.warn\(/g, "logger.warn(");

  writeFileSync(file, content);
}
```

## Special Cases

### Case 1: Development-Only Logs

**Before**:

```typescript
if (process.env.NODE_ENV === "development") {
  console.log("Debug info");
}
```

**After**:

```typescript
logger.debug("Debug info", { component: "MyComponent" });
// Logger automatically filters based on environment
```

### Case 2: Error Stack Traces

**Before**:

```typescript
console.error(error.stack);
```

**After**:

```typescript
logger.error("Error occurred", error, {
  component: "ErrorHandler",
});
// Stack trace automatically included
```

### Case 3: Table Logging

**Before**:

```typescript
console.table(users);
```

**After**:

```typescript
logger.debug(
  "Users data",
  { component: "UserList" },
  {
    users: users.map((u) => ({ id: u.id, name: u.name })),
  },
);
```

## Checklist

- [ ] Import logger in each file
- [ ] Replace console.log with logger.info
- [ ] Replace console.error with logger.error
- [ ] Replace console.warn with logger.warn
- [ ] Replace console.debug with logger.debug
- [ ] Add component context to all logs
- [ ] Add action context where appropriate
- [ ] Mask PII in log data
- [ ] Test each migrated file
- [ ] Remove development-only console.log wrappers
- [ ] Update tests to use logger
- [ ] Document component-specific logging patterns

## Rollback Strategy

If issues occur during migration:

1. **Feature Flag**: Use environment variable

   ```typescript
   const useStructuredLogging =
     process.env.ENABLE_STRUCTURED_LOGGING === "true";

   if (useStructuredLogging) {
     logger.info("Message");
   } else {
     console.log("Message");
   }
   ```

2. **Gradual Rollout**: Migrate one directory at a time
3. **Keep Console Fallback**: Structured logger already logs to console in development

## Verification

After migration, verify:

1. **Logs appear in console** (development)
2. **Logs written to files** (production)
3. **Logs forwarded to backend** (client-side)
4. **Logs appear in Grafana**
5. **No PII in logs**
6. **Context included in all logs**

## Example: Complete File Migration

**Before** (`src/services/user-service.ts`):

```typescript
export async function fetchUser(id: string) {
  console.log("Fetching user:", id);

  try {
    const user = await api.get(`/users/${id}`);
    console.log("User fetched:", user);
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}
```

**After**:

```typescript
import { createServerLogger } from "@/lib/logger/server-logger";
import { maskPII } from "@/lib/logger/utils";

const logger = createServerLogger("UserService");

export async function fetchUser(id: string) {
  logger.info("Fetching user", { action: "fetch-user" }, { userId: id });

  try {
    const user = await api.get(`/users/${id}`);
    logger.info(
      "User fetched",
      { action: "fetch-user" },
      {
        userId: id,
        email: maskPII(user.email),
      },
    );
    return user;
  } catch (error) {
    logger.error(
      "Failed to fetch user",
      error,
      {
        action: "fetch-user",
      },
      {
        userId: id,
      },
    );
    throw error;
  }
}
```

## Next Steps

After migration:

1. Run tests to ensure functionality
2. Check logs in Grafana
3. Monitor for any issues
4. Update team documentation
5. Remove old console.log patterns from linter rules
