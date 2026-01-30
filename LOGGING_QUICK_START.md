# Logging System - Quick Start Guide

Fast setup guide to get the logging system running in 5 minutes.

## Prerequisites

- Node.js 18+ and Bun installed
- Docker and Docker Compose installed
- Rust 1.75+ (for backend)

## Step 1: Start the Backend (2 minutes)

```bash
cd c:/dev/portfolio-backend

# Build the backend
cargo build

# Run the backend
cargo run
```

Backend will start on `http://localhost:3001`

## Step 2: Start Logging Stack (2 minutes)

```bash
# Still in portfolio-backend directory
docker-compose -f docker-compose.logging.yml up -d

# Verify services are running
docker-compose -f docker-compose.logging.yml ps
```

You should see 3 services running:
- **loki** (port 3100)
- **promtail** (port 9080)
- **grafana** (port 3001)

## Step 3: Access Grafana (30 seconds)

Open your browser: http://localhost:3001

**Login credentials:**
- Username: `admin`
- Password: `admin`

**Change password on first login!**

## Step 4: View Dashboards (30 seconds)

Navigate to **Dashboards** → **Portfolio**:

1. **Application Overview** - Overall system health
2. **Errors Dashboard** - Error tracking and analysis
3. **Performance Dashboard** - Performance metrics and Web Vitals
4. **Security Dashboard** - Security events and threats

## Step 5: Use in Your Code (immediate)

### Client-Side (Browser)

```typescript
import clientLogger from '@/lib/logger/client-logger';

// Log user action
clientLogger.logUserAction('button_click', {
  buttonId: 'submit',
  formName: 'contact'
});

// Log error
try {
  await riskyOperation();
} catch (error) {
  clientLogger.logError(error, {
    component: 'MyComponent',
    action: 'risky-operation'
  });
}

// Log performance
const startTime = Date.now();
await fetchData();
clientLogger.logPerformance('fetch_data', Date.now() - startTime);
```

### Server-Side (Next.js)

```typescript
import { createServerLogger } from '@/lib/logger/server-logger';

const logger = createServerLogger('MyComponent');

// Log info
logger.info('Operation completed', {
  requestId: '...'
}, {
  count: 10
});

// Log error
logger.error('Operation failed', error, {
  requestId: '...'
});
```

## Verification Checklist

- [ ] Backend running on port 3001
- [ ] Docker containers running (loki, promtail, grafana)
- [ ] Grafana accessible at http://localhost:3001
- [ ] Dashboards visible in Grafana
- [ ] Test log appears in Grafana (try logging something)

## Common Commands

```bash
# View logs from all containers
docker-compose -f docker-compose.logging.yml logs -f

# Restart logging stack
docker-compose -f docker-compose.logging.yml restart

# Stop logging stack
docker-compose -f docker-compose.logging.yml down

# View backend logs
tail -f c:/dev/portfolio-backend/logs/app.log

# View frontend logs
tail -f c:/dev/portfolio-frontend/logs/server/combined.log

# Run frontend tests
cd c:/dev/portfolio-frontend
bun run test src/lib/logger/test --run
```

## Test the System

Run this in your browser console:

```javascript
import clientLogger from '@/lib/logger/client-logger';

clientLogger.info('Test from console!', {
  component: 'browser-console'
});
```

Then check Grafana to see if the log appears (may take up to 10 seconds).

## Troubleshooting

### Logs not appearing in Grafana?

1. Wait 10-30 seconds (Promtail scrapes every 10s)
2. Check if log files exist: `ls logs/`
3. Check Promtail logs: `docker-compose -f docker-compose.logging.yml logs promtail`
4. Verify Loki is running: `curl http://localhost:3100/ready`

### Backend won't start?

1. Check if port 3001 is available: `netstat -an | findstr 3001`
2. Check Cargo.toml dependencies
3. Run `cargo build` first

### Docker containers won't start?

1. Check ports are available (3100, 3001, 9080)
2. Check disk space: `df -h` (Linux) or `dir` (Windows)
3. Try: `docker-compose -f docker-compose.logging.yml down -v` then up again

## Next Steps

- Read [docs/logging/USAGE.md](docs/logging/USAGE.md) for detailed usage
- Explore Grafana dashboards
- Set up alert notifications (Slack/Email)
- Migrate existing console.log statements

## Support

For detailed documentation, see:
- [docs/logging/README.md](docs/logging/README.md)
- [docs/logging/TROUBLESHOOTING.md](docs/logging/TROUBLESHOOTING.md)

---

**You're ready to log! 🚀**
