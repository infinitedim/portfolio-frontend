# Logging System Documentation

Comprehensive documentation for the portfolio logging system.

## Quick Links

- [Usage Guide](./USAGE.md) - How to use loggers in your code
- [Migration Guide](./MIGRATION.md) - Migrating from console.log
- [Querying Guide](./QUERYING.md) - How to query logs in Grafana
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Backend README](../../portfolio-backend/README.md) - Backend setup and infrastructure

## Overview

The logging system provides comprehensive, structured logging across the full stack:

- **Frontend**: Client and server-side logging with Pino
- **Backend**: Rust logging with tracing
- **Aggregation**: Loki for log storage
- **Visualization**: Grafana dashboards
- **Alerting**: Automated alerts for critical events

## Features

### Frontend Logging

✅ **Client-Side**

- Browser logging with automatic batching
- PII masking before transmission
- Web Vitals monitoring
- User action tracking
- Performance metrics
- Security event logging
- Automatic context enrichment

✅ **Server-Side**

- Next.js SSR logging
- API route logging
- File-based log storage with rotation
- Request/response logging in middleware
- Error boundary integration

### Backend Logging

✅ **Rust Backend**

- Structured logging with tracing
- Request ID propagation
- HTTP request/response logging
- JSON format (production) / Pretty format (development)
- Automatic log rotation
- Client log ingestion endpoint

### Log Aggregation

✅ **Loki + Promtail**

- Centralized log storage
- 30-day retention
- Label-based indexing
- High-performance queries
- Automatic log collection

✅ **Grafana**

- Pre-built dashboards
- Real-time log streaming
- Advanced filtering and search
- Alerting rules
- Multi-service correlation

## Architecture

```
┌────────────────────────────┐
│     Browser Client         │
│                            │
│  ┌──────────────────────┐  │
│  │  Client Logger       │  │
│  │  - User Actions      │  │
│  │  - Web Vitals        │  │
│  │  - Errors            │  │
│  │  - Performance       │  │
│  └──────────┬───────────┘  │
└─────────────┼──────────────┘
              │ Batch POST /api/logs
              ▼
┌────────────────────────────┐
│   Next.js Frontend         │
│                            │
│  ┌──────────────────────┐  │
│  │  Server Logger       │  │
│  │  - SSR Logging       │  │
│  │  - API Routes        │  │
│  │  - Middleware        │  │
│  └──────────┬───────────┘  │
└─────────────┼──────────────┘
              │ Write to logs/server/*.log
              │
              │ Forward client logs
              │
              ▼
┌────────────────────────────┐
│   Rust Backend             │
│                            │
│  ┌──────────────────────┐  │
│  │  Tracing Logger      │  │
│  │  - HTTP Logs         │  │
│  │  - Business Logic    │  │
│  │  - Client Logs       │  │
│  └──────────┬───────────┘  │
└─────────────┼──────────────┘
              │ Write to logs/*.log
              │
              ▼
┌────────────────────────────┐
│      Promtail              │
│  (Log Collector)           │
│                            │
│  - Scrapes log files       │
│  - Parses JSON             │
│  - Extracts labels         │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│      Loki                  │
│  (Log Storage)             │
│                            │
│  - Stores logs             │
│  - Indexes by labels       │
│  - 30-day retention        │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────┐
│    Grafana                 │
│  (Visualization)           │
│                            │
│  - Dashboards              │
│  - Queries                 │
│  - Alerts                  │
└────────────────────────────┘
```

## Getting Started

### 1. Install Frontend Dependencies

```bash
cd portfolio-frontend
bun add pino pino-pretty web-vitals
```

### 2. Start Backend

```bash
cd portfolio-backend
cargo run
```

### 3. Start Logging Stack

```bash
cd portfolio-backend
docker-compose -f docker-compose.logging.yml up -d
```

### 4. Access Grafana

Open http://localhost:3001

- Username: `admin`
- Password: `admin`

### 5. Use in Your Code

```typescript
import clientLogger from "@/lib/logger/client-logger";

clientLogger.info("Hello, logging!", {
  component: "MyComponent",
});
```

## Log Levels

| Level | Environment | Use Case                |
| ----- | ----------- | ----------------------- |
| TRACE | Development | Very detailed debugging |
| DEBUG | Dev/Staging | Debugging information   |
| INFO  | All         | General information     |
| WARN  | All         | Warning conditions      |
| ERROR | All         | Error conditions        |
| FATAL | All         | Critical errors         |

### Environment-Based Filtering

- **Development**: TRACE and above
- **Staging**: DEBUG and above
- **Production**: INFO and above

## Key Concepts

### Structured Logging

Logs are JSON objects with consistent structure:

```json
{
  "timestamp": "2026-01-29T10:30:00.000Z",
  "level": "info",
  "message": "User logged in",
  "context": {
    "requestId": "abc-123",
    "userId": "user-456",
    "component": "AuthService",
    "action": "login"
  },
  "metadata": {
    "method": "oauth",
    "duration": 245
  }
}
```

### Context Enrichment

Loggers automatically add context:

- **Request ID**: For request correlation
- **User ID**: If authenticated
- **Session ID**: For session tracking
- **Component**: Where log originated
- **Environment**: dev/staging/prod

### PII Masking

Sensitive data is automatically masked:

- Email: `user@example.com` → `u***@***.com`
- Phone: `555-123-4567` → `***-***-4567`
- Credit Card: `1234-5678-9012-3456` → `****-****-****-3456`
- Password fields: Always `[REDACTED]`

## Dashboards

### Application Overview

Monitor overall application health:

- Request rate
- Error rate
- Response time percentiles
- Active users

### Errors

Deep dive into errors:

- Error count by level
- Error rate by component
- Recent error logs
- Error distribution

### Performance

Track performance metrics:

- Response time percentiles (P50, P95, P99)
- Slow requests
- Web Vitals (LCP, FID, CLS)
- Performance heatmaps

### Security

Monitor security events:

- Suspicious patterns
- Failed authentications
- Rate limit violations
- Security events by IP

## Alerts

### Critical

- High error rate (>5/sec for 5min)
- Service down (no logs for 5min)
- Out of memory errors

### Warning

- Slow response time (P95 >2s for 10min)
- Poor Web Vitals (LCP >4s for 10min)

### Security

- Failed logins (>10 in 5min)
- Rate limit abuse (>100 in 5min)

## Best Practices

### 1. Always Use Structured Logging

✅ Good:

```typescript
logger.info(
  "User action",
  { component: "Cart" },
  {
    action: "add-item",
    productId: "123",
  },
);
```

❌ Bad:

```typescript
console.log("User added product 123 to cart");
```

### 2. Mask PII

✅ Good:

```typescript
logger.info(
  "User data",
  { component: "UserProfile" },
  {
    email: maskPII(user.email),
  },
);
```

❌ Bad:

```typescript
logger.info(
  "User data",
  { component: "UserProfile" },
  {
    email: user.email, // PII not masked!
  },
);
```

### 3. Include Context

Always include component and action:

```typescript
logger.error("Operation failed", error, {
  component: "DataProcessor",
  action: "process-batch",
  requestId: "...",
});
```

### 4. Log Performance

Track slow operations:

```typescript
const startTime = Date.now();
await operation();
const duration = Date.now() - startTime;

if (duration > 1000) {
  logger.warn(
    "Slow operation",
    { component: "Worker" },
    {
      operation: "process",
      duration,
      threshold: 1000,
    },
  );
}
```

### 5. Security Events

Log security-related events:

```typescript
clientLogger.logSecurityEvent("failed_login", "medium", {
  reason: "Invalid credentials",
  attempts: 3,
  ip: clientIp,
});
```

## Performance

### Impact

- **Client-side**: <2ms per log (batched)
- **Server-side**: <1ms per log
- **Network**: Batched every 5 seconds or 10 logs
- **Storage**: ~1KB per log entry

### Optimization

- Logs are sampled in production (10% for DEBUG)
- Batching reduces network overhead
- Async writing prevents blocking
- Log rotation prevents disk overflow

## Security

### Data Protection

- PII automatically masked
- Sensitive headers redacted
- Passwords never logged
- Tokens never logged

### Access Control

- Grafana requires authentication
- Loki accessible only internally
- Log files have restricted permissions

### Compliance

- GDPR compliant (PII masked)
- Audit trail complete
- Retention policies enforced
- Access logging enabled

## Maintenance

### Daily

- Check Grafana dashboards
- Review critical alerts
- Monitor disk usage

### Weekly

- Review slow queries
- Check log volume trends
- Update alert thresholds

### Monthly

- Review retention policies
- Update dashboards
- Audit access logs
- Backup configurations

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Contributing

When adding new logging:

1. Use existing loggers
2. Include component context
3. Mask PII
4. Add tests
5. Update documentation

## Support

For issues or questions:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review logs in Grafana
3. Check backend logs: `logs/*.log`
4. Check frontend logs: `../portfolio-frontend/logs/server/*.log`

## License

MIT
