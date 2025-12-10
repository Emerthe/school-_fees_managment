# Phase 7: Operate — Monitoring, Logging & Alerting

**Objective:** Implement comprehensive observability for the School Fees Manager with Prometheus metrics, Grafana dashboards, ELK Stack logs, and error budget-based alerting.

## Overview

Phase 7 establishes production-grade monitoring, logging, and alerting to:
- Track system health and performance in real time
- Detect and respond to failures within error budget
- Store and analyze logs for debugging and auditing
- Route critical alerts to Slack for immediate visibility

## Architecture

```
Application (Node.js)
  ├── Metrics (Prometheus client)
  │   └── /metrics endpoint
  └── Structured Logs (JSON)
      └── stdout → Logstash

Prometheus Scraper (15s interval)
  └── Time-series database
      └── Prometheus UI (9090)
      └── Alert Rules (alerts.yml)
          └── Alertmanager (9093)
              └── Slack notification

Grafana (3001)
  └── Dashboard queries Prometheus
      └── Visualize metrics, logs, events

ELK Stack
  ├── Logstash (5000) — receives JSON logs
  ├── Elasticsearch (9200) — indexes logs
  └── Kibana (5601) — log search & analysis
```

## Components

### 1. Prometheus (Metrics)
- **Purpose:** Scrapes metrics from `/metrics` endpoint (every 10s)
- **Storage:** Time-series DB (`prometheus_data` volume)
- **Retention:** Default 15 days
- **Config:** `monitoring/prometheus.yml`

**Metrics collected:**
- `http_requests_total` — total requests by method, route, status
- `http_request_duration_seconds` — request latency histogram
- `database_query_duration_seconds` — DB query latency
- `database_query_errors_total` — DB errors by type
- `active_database_connections` — connection pool usage

**Access:** http://localhost:9090

### 2. Grafana (Dashboards)
- **Purpose:** Visualize Prometheus metrics on dashboards
- **Default credentials:** admin / admin
- **Pre-built dashboard:** Dashboard ID `1860` (Node Exporter)
- **Custom dashboards:** Create via UI or provision via YAML

**Pre-configured data source:** Prometheus (http://prometheus:9090)

**Access:** http://localhost:3001

### 3. Alertmanager (Alert Routing)
- **Purpose:** Routes alerts based on severity to Slack
- **Config:** `monitoring/alertmanager.yml`
- **Triggers:** When Prometheus alert rules evaluate to `firing`

**Alert channels:**
- `#critical-alerts` — severity: critical (5-min repeat)
- `#warnings` — severity: warning (30-min repeat)

**Requires:** `SLACK_WEBHOOK` environment variable

### 4. ELK Stack (Logging)

**Logstash (5000):**
- Receives JSON logs from application stdout
- Parses and enriches with metadata
- Sends to Elasticsearch

**Elasticsearch (9200):**
- Indexes logs with daily indices: `logs-YYYY.MM.dd`
- Full-text search, analytics
- 30-day retention (optional cleanup job)

**Kibana (5601):**
- Search and visualize logs
- Create dashboards and alerts from logs

**Access:** http://localhost:5601

### 5. Node.js Application Instrumentation

**File:** `utils/metrics.js`
- Prometheus middleware (tracks HTTP requests)
- Database operation tracking
- Custom metrics for business logic

**File:** `utils/logger.js`
- Structured JSON logging (ELK-compatible)
- Log levels: DEBUG, INFO, WARN, ERROR, CRITICAL
- Automatic context (timestamp, hostname, service, env)

## Error Budget & Alerting

**SLO:** 99.9% uptime (43.2 minutes downtime per month)

**Alert rules defined in `monitoring/alerts.yml`:**

| Alert Name | Condition | Severity | Impact |
|---|---|---|---|
| HighErrorRate | >5% HTTP errors for 5 min | warning | Consumes error budget |
| ServiceDown | No metrics for 2 min | critical | Consumes ~1.4 min error budget |
| HighDatabaseLatency | P99 query >1s for 5 min | warning | Impacts user experience |
| DatabaseConnectionPoolAlmostFull | >80% connections | warning | Risk of connection exhaustion |
| RequestDurationSpike | P95 request >500ms for 10 min | warning | Impacts user experience |
| ErrorBudgetExhausted | >0.1% error rate for 30 min | critical | SLO violation |

## Quick Start

### 1. Start monitoring stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

Services will be available at:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Kibana: http://localhost:5601
- Alertmanager: http://localhost:9093

### 2. Integrate metrics into app (optional, requires prom-client)

If you add `prom-client` to `package.json`:

```bash
npm install prom-client
```

Then update `index.js`:

```javascript
const metrics = require('./utils/metrics');

app.use(metrics.metricsMiddleware);
app.get('/metrics', metrics.metricsEndpoint);
```

### 3. Configure Slack alerting

Set environment variable:

```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

Or add to `.env`:

```
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Then restart alertmanager:

```bash
docker-compose -f docker-compose.monitoring.yml restart alertmanager
```

### 4. Send test logs to Logstash

```bash
echo '{"level":"INFO","message":"Test log","service":"school-fees-manager"}' | nc -u localhost 5000
```

Then search in Kibana (http://localhost:5601).

## Dashboards

### Create a Grafana Dashboard

1. Open http://localhost:3001
2. Click **+** → New dashboard
3. Add panels:
   - **Request Rate:** `rate(http_requests_total[5m])`
   - **Error Rate:** `rate(http_requests_total{status_code=~"5.."}[5m])`
   - **Request Latency (P95):** `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - **Active DB Connections:** `active_database_connections`
4. Save dashboard

### Import Community Dashboard

1. Grafana → Dashboards → Import
2. Paste ID: `1860` (Node Exporter)
3. Select Prometheus data source

## Monitoring in Production

### Persistent Volumes

Ensure volumes are backed up and have sufficient space:

```bash
# Check volume usage
docker volume ls
docker volume inspect prometheus_data

# Back up Prometheus data
docker run --rm -v prometheus_data:/data -v /backup:/backup \
  alpine tar czf /backup/prometheus.tar.gz -C /data .
```

### Log Retention

Logstash indices grow daily. To clean old logs:

```bash
# Via Kibana: Management → Stack Management → Index Management
# Delete indices older than 30 days (e.g., logs-2024.09.*)
```

### Alert Fatigue Prevention

To avoid alert storms:
- Use `group_by` in Alertmanager config to deduplicate
- Set `repeat_interval` higher for non-critical alerts (30m+)
- Use `for` clause in alert rules to require sustained condition

### Scaling

For high-volume deployments:
- Replace single Elasticsearch with cluster (3+ nodes)
- Add dedicated Logstash nodes for log parsing
- Use S3 or other backup for long-term log storage
- Consider managed services (e.g., Datadog, New Relic) instead

## Troubleshooting

**Prometheus not scraping metrics:**
- Check `/metrics` endpoint: `curl http://localhost:3000/metrics`
- Review `prometheus.yml` for correct target
- Check Prometheus logs: `docker logs prometheus`

**Logs not in Kibana:**
- Verify Logstash is running: `docker logs logstash`
- Send test log: `echo '{"level":"INFO","message":"test"}' | nc -u localhost 5000`
- Check Elasticsearch indices: `curl http://localhost:9200/_cat/indices`

**Alerts not firing:**
- Check alert rules syntax: `docker exec prometheus promtool check rules /etc/prometheus/alerts.yml`
- Test alert query in Prometheus UI: http://localhost:9090/alerts
- Verify Alertmanager running: `docker logs alertmanager`

**Slack not receiving alerts:**
- Confirm `SLACK_WEBHOOK` env var is set
- Test webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"test"}' $SLACK_WEBHOOK`
- Check Alertmanager logs: `docker logs alertmanager`

## Files Summary

| File | Purpose |
|---|---|
| `utils/metrics.js` | Prometheus instrumentation |
| `utils/logger.js` | Structured JSON logging |
| `monitoring/prometheus.yml` | Prometheus scrape config |
| `monitoring/alerts.yml` | Alert rules (error budget) |
| `monitoring/alertmanager.yml` | Alert routing to Slack |
| `monitoring/logstash/logstash.conf` | Log parsing & enrichment |
| `docker-compose.monitoring.yml` | All monitoring services |

## Next Steps

1. Start monitoring stack: `docker-compose -f docker-compose.monitoring.yml up -d`
2. Verify Prometheus scraping: http://localhost:9090/targets
3. Create Grafana dashboards for key metrics
4. Configure Slack webhook for alerting
5. Test alert rules by simulating high error rate
6. Document dashboard links in team wiki

## References

- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Elasticsearch Docs](https://www.elastic.co/guide/index.html)
- [Error Budget Calculator](https://sre.google/sre-book/error-budgets/)
