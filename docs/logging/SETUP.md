# Logging System Setup Guide

Complete installation and configuration guide for the logging system.

## Installation

### Step 1: Frontend Dependencies

Already installed via Bun:

```bash
cd c:/dev/portfolio-frontend
bun add pino pino-pretty web-vitals
```

**Installed packages:**
- `pino@10.3.0` - Structured logging library
- `pino-pretty@13.1.3` - Pretty formatter for development
- `web-vitals@5.1.0` - Core Web Vitals monitoring

### Step 2: Backend Dependencies

Update `Cargo.toml`:

```toml
[dependencies]
# Web framework
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["trace", "request-id", "util", "cors"] }

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json", "fmt"] }
tracing-appender = "0.2"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Utilities
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
```

Then install:

```bash
cd c:/dev/portfolio-backend
cargo build
```

### Step 3: Docker Images

Pull required Docker images:

```bash
docker pull grafana/loki:latest
docker pull grafana/promtail:latest
docker pull grafana/grafana:latest
```

## Directory Structure

The following directories and files should be created:

```
portfolio-frontend/
├── src/lib/logger/
│   ├── client-logger.ts
│   ├── server-logger.ts
│   ├── web-vitals.ts
│   ├── types.ts
│   ├── config.ts
│   ├── utils.ts
│   ├── index.ts
│   └── test/
│       ├── client-logger.test.ts
│       └── utils.test.ts
├── src/app/api/logs/
│   └── route.ts
├── src/components/monitoring/
│   └── web-vitals-monitor.tsx
├── logs/server/          # Created automatically
├── docs/logging/
│   ├── README.md
│   ├── USAGE.md
│   ├── MIGRATION.md
│   ├── QUERYING.md
│   ├── SETUP.md
│   └── TROUBLESHOOTING.md
├── scripts/
│   └── migrate-console-logs.js
├── .env.example
└── LOGGING_QUICK_START.md

portfolio-backend/
├── src/
│   ├── logging/
│   │   ├── mod.rs
│   │   ├── config.rs
│   │   └── middleware.rs
│   ├── routes/
│   │   ├── mod.rs
│   │   └── logs.rs
│   └── main.rs
├── config/
│   ├── loki-config.yml
│   ├── promtail-config.yml
│   └── grafana/
│       ├── datasources/
│       │   └── loki.yml
│       ├── dashboards/
│       │   ├── dashboard-config.yml
│       │   ├── application-overview.json
│       │   ├── errors.json
│       │   ├── performance.json
│       │   └── security.json
│       └── alerts/
│           └── rules.yml
├── logs/                # Created automatically
├── data/                # Docker volumes
│   ├── loki/
│   └── grafana/
├── docker-compose.logging.yml
├── .env.example
├── Cargo.toml
└── README.md
```

## Configuration

### Environment Variables

**Frontend (`.env.local`):**

```bash
# Copy from example
cp .env.example .env.local

# Edit as needed
NODE_ENV=development
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_LOG_API_URL=/api/logs
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (`.env`):**

```bash
# Copy from example
cp .env.example .env

# Edit as needed
ENVIRONMENT=development
LOG_LEVEL=debug
PORT=3001
```

### Log Directories

Create log directories:

```bash
# Frontend
mkdir -p logs/server

# Backend
mkdir -p logs
mkdir -p data/loki data/grafana
```

Set permissions (Linux/Mac):

```bash
chmod -R 755 logs/
chmod -R 755 data/
```

## Starting Services

### Development Mode

**Terminal 1 - Backend:**

```bash
cd c:/dev/portfolio-backend
cargo run
```

**Terminal 2 - Frontend:**

```bash
cd c:/dev/portfolio-frontend
bun dev
```

**Terminal 3 - Logging Stack:**

```bash
cd c:/dev/portfolio-backend
docker-compose -f docker-compose.logging.yml up -d
```

### Production Mode

**Backend:**

```bash
cd c:/dev/portfolio-backend
cargo build --release
./target/release/portfolio-backend
```

**Frontend:**

```bash
cd c:/dev/portfolio-frontend
bun run build
bun start
```

**Logging Stack:**

```bash
docker-compose -f docker-compose.logging.yml up -d
```

## Verification

### Check Services

1. **Backend**: `curl http://localhost:3001/health`
2. **Loki**: `curl http://localhost:3100/ready`
3. **Grafana**: Open http://localhost:3001

### Check Logs

**Backend logs:**

```bash
tail -f c:/dev/portfolio-backend/logs/app.log
```

**Frontend logs:**

```bash
tail -f c:/dev/portfolio-frontend/logs/server/combined.log
```

### Test Logging

**Browser console:**

```javascript
// This will appear in Grafana after ~10 seconds
fetch('/', { method: 'GET' });
```

**Backend test:**

```rust
tracing::info!("Test log from backend");
```

## Configuration Files

### Loki (`config/loki-config.yml`)

Key settings:
- Port: 3100
- Retention: 30 days
- Storage: Filesystem
- Ingestion limit: 10MB/s

### Promtail (`config/promtail-config.yml`)

Key settings:
- Port: 9080
- Scrape interval: 10s
- Log paths:
  - Backend: `/var/log/portfolio/*.log`
  - Frontend: `/var/log/frontend/server/*.log`

### Grafana

Key settings:
- Port: 3001
- Admin user: admin/admin (change on first login)
- Data source: Loki (auto-provisioned)
- Dashboards: Auto-loaded from config/

## Security Setup

### Production Checklist

1. **Change Grafana Password:**
   ```bash
   docker-compose -f docker-compose.logging.yml exec grafana \
     grafana-cli admin reset-admin-password NewSecurePassword123
   ```

2. **Enable HTTPS:**
   - Update `docker-compose.logging.yml`
   - Add SSL certificates
   - Configure reverse proxy (nginx/caddy)

3. **Firewall Rules:**
   ```bash
   # Block external access to Loki/Promtail
   # Allow only internal network
   ```

4. **Authentication:**
   - Enable Grafana authentication
   - Set up SSO (optional)
   - Configure user roles

5. **Data Encryption:**
   - Enable encryption at rest for Loki
   - Use HTTPS for all communications

## Maintenance

### Log Rotation

**Manual rotation:**

```bash
# Compress and archive old logs
gzip logs/app.log.1
mv logs/app.log.1.gz archive/
```

**Automated (cron job):**

```bash
# Add to crontab
0 0 * * * /usr/sbin/logrotate /path/to/logrotate.conf
```

### Data Backup

**Backup Grafana dashboards:**

```bash
docker-compose -f docker-compose.logging.yml exec grafana \
  grafana-cli admin export-dashboards --path /tmp/dashboards

docker cp portfolio-grafana:/tmp/dashboards ./backups/dashboards-$(date +%Y%m%d)
```

**Backup Loki data:**

```bash
tar -czf loki-backup-$(date +%Y%m%d).tar.gz data/loki/
```

### Cleanup Old Data

```bash
# Clean logs older than 30 days
find logs/ -name "*.log.*" -mtime +30 -delete

# Clean Loki data (handled automatically by retention policy)
docker-compose -f docker-compose.logging.yml restart loki
```

## Troubleshooting

### Services Won't Start

```bash
# Check port availability
netstat -an | findstr "3100 3001 9080"

# Check Docker
docker ps
docker-compose -f docker-compose.logging.yml ps

# View logs
docker-compose -f docker-compose.logging.yml logs
```

### No Logs in Grafana

```bash
# Check if logs are being written
ls -la logs/
tail -f logs/app.log

# Check Promtail status
docker-compose -f docker-compose.logging.yml logs promtail

# Test Loki
curl http://localhost:3100/loki/api/v1/labels
```

### High Resource Usage

```bash
# Check Docker stats
docker stats

# Reduce Loki retention
# Edit config/loki-config.yml: retention_period: 168h  # 7 days

# Restart Loki
docker-compose -f docker-compose.logging.yml restart loki
```

## Uninstall

To completely remove the logging system:

```bash
# Stop and remove containers
docker-compose -f docker-compose.logging.yml down -v

# Remove log directories
rm -rf logs/ data/

# Remove code (if needed)
rm -rf src/lib/logger/
rm -rf src/app/api/logs/
rm src/components/monitoring/web-vitals-monitor.tsx
rm -rf docs/logging/
```

## Next Steps

- Review [USAGE.md](./USAGE.md) for how to use loggers
- Explore Grafana dashboards
- Set up alert notifications
- Migrate existing console.log statements

## Support

For issues:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review service logs
3. Verify configuration files
4. Check environment variables
