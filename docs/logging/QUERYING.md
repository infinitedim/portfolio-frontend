# Log Querying Guide

Complete guide for querying logs in Grafana using LogQL.

## Table of Contents

- [LogQL Basics](#logql-basics)
- [Common Queries](#common-queries)
- [Advanced Patterns](#advanced-patterns)
- [Performance Tips](#performance-tips)

## LogQL Basics

LogQL is Loki's query language, similar to Prometheus' PromQL.

### Query Structure

```
{label_selector} |= "search text" | json | filter
```

### Label Selectors

Select logs by labels:

```logql
{job="portfolio-backend"}          # All backend logs
{service="frontend"}                # All frontend logs
{level="error"}                     # All error logs
{component="auth"}                  # Logs from auth component
{level="error", service="frontend"} # Frontend errors only
```

### Text Search

Search within log messages:

```logql
{job="portfolio-backend"} |= "user login"      # Contains "user login"
{job="portfolio-backend"} != "health check"    # Does not contain
{job="portfolio-backend"} |~ "error|failed"    # Regex match
```

### JSON Parsing

Parse JSON logs:

```logql
{job="portfolio-backend"} | json
{job="portfolio-backend"} | json | level="error"
```

## Common Queries

### View All Logs

```logql
# All logs from all services
{}

# All backend logs
{job="portfolio-backend"}

# All frontend logs
{service="frontend"}
```

### Error Logs

```logql
# All errors
{level="error"}

# Errors from specific service
{level="error", service="frontend"}

# Errors and fatal logs
{level=~"error|fatal"}

# Errors from specific component
{level="error", component="auth"}
```

### Filter by Time Range

Use Grafana's time picker or:

```logql
# Last hour
{job="portfolio-backend"}

# Specific time range
{job="portfolio-backend"} [1h]
```

### Search by Request ID

```logql
# Find all logs for a request
{} |= "request_id=abc-123" | json

# Better: filter by label
{request_id="abc-123"}
```

### User Actions

```logql
# All user actions
{service="frontend", log_type="client"} |= "User action"

# Specific action type
{service="frontend"} | json | actionType="button_click"

# Actions from specific user
{service="frontend"} | json | userId="user-123"
```

### API Calls

```logql
# All API calls
{job="portfolio-backend"} |= "request completed"

# Slow API calls (>1s)
{job="portfolio-backend"} | json | duration_ms > 1000

# Failed API calls
{job="portfolio-backend"} | json | status >= 400

# Specific endpoint
{job="portfolio-backend"} | json | uri="/api/users"
```

### Web Vitals

```logql
# All Web Vitals metrics
{service="frontend", log_type="client"} |= "Performance:"

# Poor LCP (>4s)
{service="frontend"} |= "LCP" | json | value > 4000

# Poor FID (>300ms)
{service="frontend"} |= "FID" | json | value > 300

# All metrics from mobile devices
{service="frontend", device_type="mobile"} |= "Performance:"
```

### Security Events

```logql
# All suspicious requests
{} |= "Suspicious request detected"

# Failed authentication attempts
{} |= "authentication failed"

# Rate limit violations
{} |= "Rate limit exceeded"

# Security events by IP
{} |= "Security event" | json | ipAddress="192.168.1.1"
```

## Advanced Patterns

### Count Queries

```logql
# Count errors per minute
sum(count_over_time({level="error"} [1m]))

# Count by service
sum by (service) (count_over_time({level="error"} [1m]))

# Error rate
sum(rate({level="error"} [5m]))
```

### Percentile Queries

```logql
# P95 response time
quantile_over_time(0.95,
  {job="portfolio-backend"}
  | json
  | duration_ms != ""
  | unwrap duration_ms [5m]
)

# P50, P95, P99
quantile_over_time(0.50, ...) # P50
quantile_over_time(0.95, ...) # P95
quantile_over_time(0.99, ...) # P99
```

### Average Queries

```logql
# Average response time
avg_over_time(
  {job="portfolio-backend"}
  | json
  | unwrap duration_ms [10m]
)

# Average by endpoint
avg by (uri) (
  avg_over_time(
    {job="portfolio-backend"}
    | json
    | unwrap duration_ms [10m]
  )
)
```

### Pattern Matching

```logql
# Match multiple patterns
{job="portfolio-backend"} |~ "error|failed|exception"

# Exclude patterns
{job="portfolio-backend"} != "health check" != "ping"

# Case-insensitive search
{job="portfolio-backend"} |~ "(?i)error"
```

### Label Extraction

```logql
# Extract labels from JSON
{service="frontend"}
| json
| line_format "{{.level}} - {{.message}}"

# Extract and filter
{service="frontend"}
| json
| status_code=`status`
| status_code >= 400
```

### Multi-Line Queries

```logql
# Combine multiple conditions
{job="portfolio-backend"}
| json
| level="error"
| component="database"
| duration_ms > 1000
```

## Query Examples by Use Case

### Debugging a Request

```logql
# Find all logs for a specific request
{request_id="abc-123-def-456"}

# Or search by request ID
{} |= "abc-123-def-456" | json
```

### Tracking User Journey

```logql
# All actions by user
{service="frontend"} | json | userId="user-123"

# User journey with timestamps
{service="frontend"}
| json
| userId="user-123"
| line_format "{{.timestamp}} - {{.actionType}}"
```

### Finding Slow Operations

```logql
# Operations taking >5 seconds
{job="portfolio-backend"}
| json
| duration_ms > 5000
| line_format "{{.uri}} took {{.duration_ms}}ms"
```

### Investigating Errors

```logql
# All errors with stack traces
{level="error"}
| json
| stack != ""

# Errors by component
sum by (component) (
  count_over_time({level="error"} [1h])
)

# Most common error messages
topk(10,
  sum by (message) (
    count_over_time({level="error"} [1h])
  )
)
```

### Security Audit

```logql
# All failed login attempts
{} |= "authentication failed" | json

# Failed logins by IP
sum by (ipAddress) (
  count_over_time(
    {} |= "authentication failed" | json [1h]
  )
)

# Suspicious activity from IP
{}
| json
| ipAddress="192.168.1.100"
| level=~"warn|error"
```

### Performance Analysis

```logql
# Slowest endpoints (P95)
topk(10,
  quantile_over_time(0.95,
    {job="portfolio-backend"}
    | json
    | unwrap duration_ms [1h]
  ) by (uri)
)

# Requests by status code
sum by (status) (
  count_over_time(
    {job="portfolio-backend"}
    | json [1h]
  )
)
```

## Performance Tips

### 1. Always Use Label Filters First

✅ Good:

```logql
{job="portfolio-backend", level="error"} | json
```

❌ Bad:

```logql
{} | json | level="error"  # Scans all logs!
```

### 2. Limit Time Range

Use smaller time ranges for faster queries:

- Last 5 minutes for real-time debugging
- Last 1 hour for recent issues
- Last 24 hours for trends

### 3. Use Specific Labels

✅ Good:

```logql
{service="frontend", component="auth", level="error"}
```

❌ Bad:

```logql
{} |= "auth" |= "error"
```

### 4. Limit Results

Use `| limit 100` to cap results:

```logql
{level="error"} | limit 100
```

### 5. Use Aggregations

Instead of viewing all logs, aggregate:

```logql
# Instead of viewing all logs
{level="error"}

# Count them
sum(count_over_time({level="error"} [5m]))
```

## Grafana Dashboard Integration

### Creating Panels

1. Add new panel
2. Select Loki as data source
3. Enter LogQL query
4. Choose visualization type:
   - **Logs**: Raw log viewer
   - **Time series**: Metrics over time
   - **Stat**: Single value
   - **Table**: Tabular data
   - **Bar chart**: Comparisons
   - **Pie chart**: Distributions

### Variables

Create dashboard variables for dynamic queries:

```
# Service variable
label_values(service)

# Component variable
label_values(component)

# Use in query
{service="$service", component="$component"}
```

### Alerts

Create alerts on queries:

```logql
# Alert if error rate > 5/s
sum(rate({level="error"} [5m])) > 5
```

## Troubleshooting Queries

### Query Too Slow

1. Add more label filters
2. Reduce time range
3. Use aggregations instead of raw logs
4. Check Loki performance

### No Results

1. Verify label names (case-sensitive)
2. Check time range
3. Verify log format (JSON vs text)
4. Check if logs are being ingested

### Unexpected Results

1. Check label extraction
2. Verify JSON parsing
3. Test filters individually
4. Review log format

## Next Steps

- Practice with example queries
- Create custom dashboards
- Set up alerts
- Explore advanced LogQL features
