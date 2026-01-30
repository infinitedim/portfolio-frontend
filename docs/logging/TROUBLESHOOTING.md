# Logging System Troubleshooting Guide

Common issues and solutions for the logging system.

## Table of Contents

- [No Logs Appearing](#no-logs-appearing)
- [Logs Not Forwarding to Backend](#logs-not-forwarding-to-backend)
- [Grafana Issues](#grafana-issues)
- [Performance Issues](#performance-issues)
- [Configuration Issues](#configuration-issues)

## No Logs Appearing

### Issue: No logs in console (development)

**Symptoms:**

- Console is empty
- No log output in terminal

**Solutions:**

1. Check logger is imported:

   ```typescript
   import clientLogger from "@/lib/logger/client-logger";
   ```

2. Verify environment variables:

   ```bash
   echo $NODE_ENV
   echo $NEXT_PUBLIC_LOG_LEVEL
   ```

3. Check log level:

   ```typescript
   // Should show TRACE or DEBUG in development
   console.log(process.env.NODE_ENV);
   ```

4. Test logger directly:
   ```typescript
   clientLogger.info("Test log");
   ```

### Issue: No logs in files (production)

**Symptoms:**

- Log files are empty
- Files not created

**Solutions:**

1. Check directory permissions:

   ```bash
   ls -la logs/server/
   chmod 755 logs/server/
   ```

2. Verify file logging is enabled:

   ```typescript
   // In server-logger.ts
   if (serverConfig.file) {
     // Should be true in production
   }
   ```

3. Check disk space:

   ```bash
   df -h
   ```

4. Review server logger initialization:
   ```typescript
   import { createServerLogger } from "@/lib/logger/server-logger";
   const logger = createServerLogger("test");
   logger.info("Test log");
   ```

### Issue: No logs in Grafana

**Symptoms:**

- Grafana shows "No data"
- Empty dashboards

**Solutions:**

1. Check Loki is running:

   ```bash
   docker-compose -f docker-compose.logging.yml ps
   curl http://localhost:3100/ready
   ```

2. Check Promtail is running:

   ```bash
   docker-compose -f docker-compose.logging.yml logs promtail
   ```

3. Verify log files exist:

   ```bash
   ls -la logs/
   ls -la ../portfolio-frontend/logs/server/
   ```

4. Check Promtail configuration:

   ```bash
   cat config/promtail-config.yml
   # Verify paths match log file locations
   ```

5. Test Loki endpoint:

   ```bash
   curl http://localhost:3100/loki/api/v1/labels
   ```

6. Check Grafana data source:
   - Go to Configuration → Data Sources
   - Verify Loki URL: `http://loki:3100`
   - Test connection

## Logs Not Forwarding to Backend

### Issue: Client logs not reaching backend

**Symptoms:**

- Browser shows logs
- Backend doesn't receive them
- `/api/logs` endpoint returns errors

**Solutions:**

1. Check network tab in browser:
   - Look for POST requests to `/api/logs`
   - Check response status

2. Verify API endpoint:

   ```bash
   curl -X POST http://localhost:3000/api/logs \
     -H "Content-Type: application/json" \
     -d '{"logs": []}'
   ```

3. Check CORS configuration:

   ```typescript
   // In next.config.ts or middleware
   // Verify CORS allows POST to /api/logs
   ```

4. Review rate limiting:

   ```typescript
   // Check if hitting rate limits
   // Look for 429 responses
   ```

5. Check batching configuration:

   ```typescript
   // In client-logger.ts
   maxBatchSize: 10,
   maxBatchWait: 5000,
   ```

6. Force flush logs:
   ```typescript
   clientLogger.flush();
   ```

## Grafana Issues

### Issue: Can't login to Grafana

**Symptoms:**

- Login page appears but credentials don't work
- "Invalid username or password"

**Solutions:**

1. Use default credentials:
   - Username: `admin`
   - Password: `admin`

2. Reset password:

   ```bash
   docker-compose -f docker-compose.logging.yml exec grafana \
     grafana-cli admin reset-admin-password newpassword
   ```

3. Check Grafana logs:
   ```bash
   docker-compose -f docker-compose.logging.yml logs grafana
   ```

### Issue: Dashboards not loading

**Symptoms:**

- "Dashboard not found"
- Empty dashboard list

**Solutions:**

1. Verify dashboard provisioning:

   ```bash
   ls -la config/grafana/dashboards/
   ```

2. Check dashboard configuration:

   ```bash
   cat config/grafana/dashboards/dashboard-config.yml
   ```

3. Restart Grafana:

   ```bash
   docker-compose -f docker-compose.logging.yml restart grafana
   ```

4. Import dashboards manually:
   - Go to Dashboards → Import
   - Upload JSON files from `config/grafana/dashboards/`

### Issue: Queries timeout

**Symptoms:**

- "Query timeout"
- Slow dashboard loading

**Solutions:**

1. Reduce time range (use last 1h instead of 24h)

2. Add more label filters:

   ```logql
   # Instead of
   {}

   # Use
   {job="portfolio-backend", level="error"}
   ```

3. Use aggregations:

   ```logql
   # Instead of raw logs
   {level="error"}

   # Count them
   sum(count_over_time({level="error"} [5m]))
   ```

4. Increase query timeout:
   ```yaml
   # In loki-config.yml
   query_range:
     max_query_length: 721h # Increase if needed
   ```

## Performance Issues

### Issue: High memory usage (Loki)

**Symptoms:**

- Loki container using >2GB RAM
- System slowdown

**Solutions:**

1. Check Loki memory limits:

   ```bash
   docker stats portfolio-loki
   ```

2. Reduce retention period:

   ```yaml
   # In loki-config.yml
   limits_config:
     retention_period: 168h # 7 days instead of 30
   ```

3. Run compaction:

   ```bash
   docker-compose -f docker-compose.logging.yml restart loki
   ```

4. Clear old data:
   ```bash
   rm -rf data/loki/*
   docker-compose -f docker-compose.logging.yml restart loki
   ```

### Issue: High CPU usage (Promtail)

**Symptoms:**

- Promtail using >50% CPU
- System lag

**Solutions:**

1. Check log file sizes:

   ```bash
   du -sh logs/*
   ```

2. Implement log rotation:

   ```bash
   # Run logrotate
   logrotate -f logrotate.conf
   ```

3. Reduce scrape frequency:
   ```yaml
   # In promtail-config.yml
   # Add to scrape_configs
   sync_period: 10s # Increase from 1s
   ```

### Issue: Slow application performance

**Symptoms:**

- App slower after adding logging
- High response times

**Solutions:**

1. Check log level in production:

   ```bash
   # Should be INFO, not DEBUG or TRACE
   echo $NEXT_PUBLIC_LOG_LEVEL
   ```

2. Enable sampling:

   ```typescript
   // Already configured in config.ts
   SAMPLING_CONFIG.debug = 0.1; // Sample 10% in production
   ```

3. Increase batch size:

   ```typescript
   // In clientConfig
   batch: {
     maxBatchSize: 20,  // Increase from 10
     maxBatchWait: 10000,  // Increase from 5000
   }
   ```

4. Disable file logging in development:
   ```typescript
   // In serverConfig
   file: process.env.NODE_ENV !== "development";
   ```

## Configuration Issues

### Issue: Environment variables not working

**Symptoms:**

- Logs at wrong level
- Configuration not applied

**Solutions:**

1. Check .env file exists:

   ```bash
   ls -la .env .env.local
   ```

2. Verify variable names:

   ```bash
   # Frontend uses NEXT_PUBLIC_ prefix
   NEXT_PUBLIC_LOG_LEVEL=debug

   # Backend uses no prefix
   LOG_LEVEL=debug
   ```

3. Restart application:

   ```bash
   # Frontend
   npm run dev

   # Backend
   cargo run
   ```

4. Check in code:
   ```typescript
   console.log("LOG_LEVEL:", process.env.NEXT_PUBLIC_LOG_LEVEL);
   ```

### Issue: Log rotation not working

**Symptoms:**

- Log files growing too large
- Disk space issues

**Solutions:**

1. Check rotation configuration:

   ```typescript
   // In server-logger.ts
   ROTATION_CONFIG = {
     maxSize: "50m",
     maxFiles: 10,
   };
   ```

2. Verify rotation is triggered:

   ```bash
   # Check file sizes
   ls -lh logs/server/
   ```

3. Manual rotation:

   ```bash
   # Compress and rotate logs
   gzip logs/server/combined.log
   mv logs/server/combined.log.gz logs/server/combined.log.1.gz
   ```

4. Set up cron job (Linux):
   ```bash
   # Add to crontab
   0 0 * * * /usr/sbin/logrotate /path/to/logrotate.conf
   ```

### Issue: PII not being masked

**Symptoms:**

- Emails visible in logs
- Phone numbers not masked

**Solutions:**

1. Verify maskPII is enabled:

   ```typescript
   // In config.ts
   maskPII: true,
   ```

2. Use maskPII explicitly:

   ```typescript
   import { maskPII } from "@/lib/logger/utils";

   logger.info("User data", undefined, {
     email: maskPII(user.email),
     phone: maskPII(user.phone),
   });
   ```

3. Check PII patterns:
   ```typescript
   // In config.ts
   PII_PATTERNS = {
     email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
     // ... more patterns
   };
   ```

## Docker Issues

### Issue: Containers not starting

**Symptoms:**

- `docker-compose up` fails
- Containers in "Exited" state

**Solutions:**

1. Check logs:

   ```bash
   docker-compose -f docker-compose.logging.yml logs
   ```

2. Verify ports are available:

   ```bash
   netstat -an | grep 3100  # Loki
   netstat -an | grep 3001  # Grafana
   netstat -an | grep 9080  # Promtail
   ```

3. Remove old containers:

   ```bash
   docker-compose -f docker-compose.logging.yml down
   docker-compose -f docker-compose.logging.yml up -d
   ```

4. Check disk space:
   ```bash
   df -h
   ```

### Issue: Volume permission errors

**Symptoms:**

- "Permission denied" errors
- Containers can't write to volumes

**Solutions:**

1. Fix permissions:

   ```bash
   sudo chown -R $(whoami) data/
   sudo chmod -R 755 data/
   ```

2. Update docker-compose.yml:
   ```yaml
   volumes:
     - ./data/loki:/loki:rw
   ```

## Emergency Procedures

### Complete Reset

If nothing works, reset everything:

```bash
# Stop all containers
docker-compose -f docker-compose.logging.yml down -v

# Remove data
rm -rf data/loki/* data/grafana/*

# Remove logs
rm -rf logs/*

# Restart containers
docker-compose -f docker-compose.logging.yml up -d

# Wait 30 seconds
sleep 30

# Test
curl http://localhost:3100/ready
curl http://localhost:3001/api/health
```

### Backup Before Reset

```bash
# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# Backup Grafana data
tar -czf grafana-backup-$(date +%Y%m%d).tar.gz data/grafana/

# Backup Loki data
tar -czf loki-backup-$(date +%Y%m%d).tar.gz data/loki/
```

## Getting Help

If issues persist:

1. Check logs in order:
   - Application logs (console)
   - File logs (logs/\*.log)
   - Container logs (docker logs)
   - System logs (/var/log/)

2. Collect diagnostic info:

   ```bash
   # System info
   uname -a
   docker --version
   docker-compose --version

   # Container status
   docker-compose -f docker-compose.logging.yml ps

   # Disk usage
   df -h
   du -sh logs/ data/
   ```

3. Review configuration:
   - Environment variables
   - Config files
   - Docker compose file

4. Create minimal reproduction:
   ```typescript
   // Test with simple log
   import clientLogger from "@/lib/logger/client-logger";
   clientLogger.info("Test");
   ```
