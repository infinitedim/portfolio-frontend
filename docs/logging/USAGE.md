# Logging System Usage Guide

Complete guide for using the logging system in your code.

## Table of Contents

- [Getting Started](#getting-started)
- [Client-Side Logging](#client-side-logging)
- [Server-Side Logging](#server-side-logging)
- [Log Levels](#log-levels)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Getting Started

Import the appropriate logger based on where your code runs:

```typescript
// Client-side (browser)
import clientLogger from "@/lib/logger/client-logger";

// Server-side (Next.js SSR, API routes)
import { createServerLogger } from "@/lib/logger/server-logger";
```

## Client-Side Logging

### Basic Logging

```typescript
import clientLogger from "@/lib/logger/client-logger";

// Info message
clientLogger.info(
  "User logged in",
  {
    component: "AuthForm",
    action: "login",
  },
  {
    userId: user.id,
    method: "oauth",
  },
);

// Warning
clientLogger.warn(
  "Slow network detected",
  {
    component: "NetworkMonitor",
  },
  {
    latency: 2000,
  },
);

// Error
clientLogger.error("Failed to load data", error, {
  component: "DataLoader",
  action: "fetch",
});
```

### User Actions

Track user interactions:

```typescript
clientLogger.logUserAction("button_click", {
  buttonId: "submit-form",
  formName: "contact",
  page: "/contact",
});

clientLogger.logUserAction("page_view", {
  path: "/products",
  referrer: document.referrer,
});
```

### Performance Metrics

Log performance measurements:

```typescript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;

clientLogger.logPerformance("api_call", duration, {
  endpoint: "/api/products",
  method: "GET",
});
```

### Security Events

Log security-related events:

```typescript
clientLogger.logSecurityEvent("failed_login", "medium", {
  reason: "Invalid credentials",
  attempts: 3,
});

clientLogger.logSecurityEvent("suspicious_activity", "high", {
  action: "Multiple rapid requests",
  count: 50,
});
```

### API Calls

Log API requests and responses:

```typescript
const startTime = Date.now();
try {
  const response = await fetch("/api/users");
  const duration = Date.now() - startTime;

  clientLogger.logApiCall("GET", "/api/users", response.status, duration, {
    userId: currentUser.id,
  });
} catch (error) {
  clientLogger.error("API call failed", error, {
    component: "UsersList",
    action: "fetch-users",
  });
}
```

## Server-Side Logging

### Creating a Logger

Create a logger instance for your component:

```typescript
import { createServerLogger } from "@/lib/logger/server-logger";

const logger = createServerLogger("MyComponent");
```

### API Route Logging

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerLogger } from "@/lib/logger/server-logger";

const logger = createServerLogger("api/users");

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id");

  try {
    logger.info("Fetching users", { requestId });

    const users = await fetchUsers();

    const duration = Date.now() - startTime;
    logger.logHttp(
      "GET",
      "/api/users",
      200,
      duration,
      { requestId },
      { userCount: users.length },
    );

    return NextResponse.json(users);
  } catch (error) {
    logger.error("Failed to fetch users", error, { requestId });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Server Component Logging

```typescript
// app/products/page.tsx
import { createServerLogger } from '@/lib/logger/server-logger';

const logger = createServerLogger('ProductsPage');

export default async function ProductsPage() {
  try {
    logger.info('Rendering products page');

    const products = await fetchProducts();

    logger.debug('Products fetched', undefined, {
      count: products.length
    });

    return <ProductsList products={products} />;
  } catch (error) {
    logger.error('Failed to render products page', error);
    throw error;
  }
}
```

## Log Levels

### When to Use Each Level

| Level     | Use Case                | Example                            |
| --------- | ----------------------- | ---------------------------------- |
| **TRACE** | Very detailed debugging | Variable values, loop iterations   |
| **DEBUG** | Debugging information   | Function entry/exit, state changes |
| **INFO**  | General information     | Successful operations, milestones  |
| **WARN**  | Warning conditions      | Recoverable errors, deprecations   |
| **ERROR** | Error conditions        | Exceptions, failed operations      |
| **FATAL** | Critical errors         | System shutdown, data loss         |

### Examples

```typescript
// TRACE - Very detailed
logger.trace("Processing item", { itemId: 123 }, { index: 5 });

// DEBUG - Debugging
logger.debug("Cache hit", { key: "user:123" });

// INFO - General information
logger.info("User registered", {
  userId: user.id,
  email: maskPII(user.email),
});

// WARN - Warnings
logger.warn("Rate limit approaching", {
  current: 95,
  limit: 100,
});

// ERROR - Errors
logger.error("Database connection failed", error, {
  host: "db.example.com",
});

// FATAL - Critical
logger.fatal("Out of memory", error, {
  memoryUsage: process.memoryUsage(),
});
```

## Best Practices

### 1. Use Structured Logging

✅ **Good**:

```typescript
logger.info(
  "User action",
  {
    component: "ShoppingCart",
    action: "add-item",
  },
  {
    productId: "123",
    quantity: 2,
    userId: user.id,
  },
);
```

❌ **Bad**:

```typescript
logger.info(`User ${user.id} added product 123 to cart`);
```

### 2. Mask PII

✅ **Good**:

```typescript
import { maskPII } from "@/lib/logger/utils";

logger.info("User data", {
  userId: user.id,
  email: maskPII(user.email),
  phone: maskPII(user.phone),
});
```

❌ **Bad**:

```typescript
logger.info("User data", {
  email: user.email, // PII not masked!
  phone: user.phone,
});
```

### 3. Include Context

Always include component and action in context:

```typescript
logger.info(
  "Operation completed",
  {
    component: "DataProcessor",
    action: "process-batch",
    requestId: "...",
  },
  {
    itemsProcessed: 100,
    duration: 1523,
  },
);
```

### 4. Log Errors Properly

✅ **Good**:

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error(
    "Operation failed",
    error,
    {
      component: "Worker",
      action: "process-task",
    },
    {
      taskId: task.id,
      retryCount: 3,
    },
  );
}
```

❌ **Bad**:

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error("Error: " + error.message); // Loses stack trace
}
```

### 5. Use Child Loggers

Create child loggers for scoped logging:

```typescript
const baseLogger = createServerLogger("OrderService");

function processOrder(orderId: string) {
  const logger = baseLogger.child({
    orderId,
    requestId: crypto.randomUUID(),
  });

  logger.info("Processing order");
  // All subsequent logs include orderId and requestId
  logger.debug("Validating order");
  logger.info("Order processed successfully");
}
```

## Common Patterns

### Pattern 1: Try-Catch with Logging

```typescript
async function fetchData() {
  try {
    logger.info("Fetching data", { component: "DataFetcher" });

    const data = await api.get("/data");

    logger.info("Data fetched successfully", undefined, {
      count: data.length,
    });

    return data;
  } catch (error) {
    logger.error("Failed to fetch data", error, {
      component: "DataFetcher",
    });
    throw error;
  }
}
```

### Pattern 2: Performance Monitoring

```typescript
async function heavyOperation() {
  const startTime = Date.now();

  try {
    logger.debug("Starting heavy operation");

    const result = await doWork();

    const duration = Date.now() - startTime;
    clientLogger.logPerformance("heavy_operation", duration, {
      resultSize: result.length,
    });

    return result;
  } finally {
    const duration = Date.now() - startTime;
    if (duration > 5000) {
      logger.warn("Heavy operation took too long", undefined, {
        duration,
        threshold: 5000,
      });
    }
  }
}
```

### Pattern 3: Request/Response Logging

```typescript
async function apiHandler(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get("x-request-id");

  logger.logRequest(
    request.method,
    request.url,
    Object.fromEntries(request.headers.entries()),
    { requestId },
  );

  try {
    const response = await handleRequest(request);

    logger.logResponse(
      request.method,
      request.url,
      response.status,
      Date.now() - startTime,
      { requestId },
    );

    return response;
  } catch (error) {
    logger.error("Request failed", error, { requestId });
    throw error;
  }
}
```

### Pattern 4: User Journey Tracking

```typescript
// Track complete user journey
function trackUserJourney(userId: string) {
  // Step 1: Login
  clientLogger.logUserAction("login", {
    userId,
    method: "password",
  });

  // Step 2: Browse products
  clientLogger.logUserAction("browse_products", {
    userId,
    category: "electronics",
  });

  // Step 3: Add to cart
  clientLogger.logUserAction("add_to_cart", {
    userId,
    productId: "123",
    quantity: 1,
  });

  // Step 4: Checkout
  clientLogger.logUserAction("checkout", {
    userId,
    cartValue: 99.99,
  });
}
```

## Next Steps

- Read [QUERYING.md](./QUERYING.md) to learn how to query logs in Grafana
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- See [../README.md](../../README.md) for system architecture
