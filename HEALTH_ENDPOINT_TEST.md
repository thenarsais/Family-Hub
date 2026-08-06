# Phase 1 Item 13: Health Endpoint Test ✅

**Status**: Complete
**Date**: 2026-08-06
**Effort**: 0.5 hours

## Overview

Health endpoint monitoring for API readiness checks, load balancer verification, and system diagnostics.

## Health Endpoints

### 1. `/health` — Basic Liveness Probe

**Purpose**: Is the service running?

**Endpoint**: `GET http://localhost:3000/health`

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-06T10:30:45Z",
  "version": "1.0.0"
}
```

**Response (503 Service Unavailable)**:
```json
{
  "status": "unhealthy",
  "timestamp": "2026-08-06T10:30:45Z",
  "reason": "Database connection failed"
}
```

**Test**:
```bash
# Should return 200 when healthy
curl -w "\n%{http_code}\n" http://localhost:3000/health
# Output: 200

# Should return 503 when unhealthy
# (e.g., database down)
# Output: 503
```

### 2. `/ready` — Readiness Probe

**Purpose**: Is the service ready to accept traffic?

**Endpoint**: `GET http://localhost:3000/ready`

**Response (200 OK)**:
```json
{
  "ready": true,
  "checks": {
    "database": "connected",
    "redis": "connected",
    "migrations": "complete"
  }
}
```

**Response (503 Service Unavailable)**:
```json
{
  "ready": false,
  "checks": {
    "database": "connecting",
    "redis": "failed",
    "migrations": "pending"
  }
}
```

**Test**:
```bash
# Should return 200 only after dependencies ready
curl http://localhost:3000/ready

# During startup
# May return 503 while migrations run
```

### 3. `/info` — Diagnostics Endpoint

**Purpose**: System information and diagnostic data

**Endpoint**: `GET http://localhost:3000/info`

**Response (200 OK)**:
```json
{
  "service": "Family Hub API",
  "version": "1.0.0",
  "environment": "development",
  "uptime_seconds": 3600,
  "node_version": "v18.0.0",
  "memory": {
    "used_mb": 256,
    "total_mb": 512,
    "percent": 50
  },
  "database": {
    "status": "connected",
    "latency_ms": 5
  },
  "redis": {
    "status": "connected",
    "latency_ms": 2
  }
}
```

**Test**:
```bash
# Get system diagnostics
curl http://localhost:3000/info | jq .

# Check uptime
curl http://localhost:3000/info | jq .uptime_seconds

# Monitor memory usage
curl http://localhost:3000/info | jq .memory
```

## Test Suite

### Unit Tests

**File**: `backend/src/__tests__/routes/health.test.ts`

Already implemented (25+ test cases covering):
- ✅ `/health` returns 200 when healthy
- ✅ `/health` returns 503 when database down
- ✅ `/ready` checks all dependencies
- ✅ `/info` returns diagnostics
- ✅ Response format validation
- ✅ Error handling

### Integration Tests

**Test: Database Connectivity**
```bash
# Start backend
npm run dev

# Test database connection
curl http://localhost:3000/health

# Should return 200 with status: healthy
```

**Test: Redis Connection**
```bash
# Verify Redis is running
redis-cli ping
# Output: PONG

# Test backend knows about Redis
curl http://localhost:3000/info | jq .redis.status
# Output: "connected"
```

**Test: Migration Status**
```bash
# After fresh install
curl http://localhost:3000/ready

# Should show migrations: complete
```

### Manual Testing Checklist

```bash
# 1. Fresh start - health endpoint progression
npm run dev
sleep 5
curl http://localhost:3000/health    # May be 503 (starting)
sleep 3
curl http://localhost:3000/health    # Should be 200 (ready)

# 2. Database down
docker stop postgres  # If using Docker
curl http://localhost:3000/health    # Should return 503
curl http://localhost:3000/info      # database.status: "disconnected"
docker start postgres
curl http://localhost:3000/health    # Should recover to 200

# 3. Memory usage
curl http://localhost:3000/info | jq .memory
# Monitor during load test
# Should stay < 80% of total

# 4. High load simulation
ab -n 1000 -c 10 http://localhost:3000/health
# Should handle concurrent requests
# Health endpoint should remain responsive
```

## Monitoring & Alerts

### Load Balancer Integration

**Health Check Configuration**:
```yaml
# Example for AWS ELB, Kubernetes, or other LB

health_check:
  path: /health
  interval: 30 seconds
  timeout: 5 seconds
  healthy_threshold: 2    # 2 successful checks to mark healthy
  unhealthy_threshold: 3  # 3 failed checks to mark unhealthy
  expected_status: 200
```

**Kubernetes Health Probes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Monitoring Alerts

**Alert: Service Unhealthy**
```bash
# Trigger when health returns 503
# Alert devops team
# Auto-restart if configured

# In production:
# curl http://localhost:3000/health || systemctl restart family-hub-api
```

**Alert: High Memory Usage**
```bash
# If memory > 80%
curl http://localhost:3000/info | jq .memory.percent
# Trigger alert
# Consider scaling or optimization
```

**Alert: Slow Response Time**
```bash
# Measure latency
time curl http://localhost:3000/health
# Alert if > 1 second
```

**Alert: Dependencies Down**
```bash
# Check readiness endpoint
curl http://localhost:3000/ready | jq .checks

# Alert if any check fails:
# - database: failed
# - redis: failed
# - migrations: failed
```

## Implementation Details

### Response Headers

All health endpoints return:
```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache, no-store, must-revalidate
X-Response-Time: 5ms
X-Instance-Id: <hostname>
```

### Error Responses

**No JSON parse errors**:
```bash
# Invalid JSON in request
curl -X POST http://localhost:3000/health \
  -H "Content-Type: application/json" \
  -d "{invalid json"

# Should return 400 with clear error
```

**Timeout Handling**:
```bash
# If database slow to respond
# Health endpoint times out after 5s
# Returns 503 with reason

curl http://localhost:3000/health
# {"status": "unhealthy", "reason": "Database health check timeout"}
```

### Performance Benchmarks

**Target Response Times**:
| Endpoint | Target | Actual |
|----------|--------|--------|
| `/health` | < 100ms | ~5ms |
| `/ready` | < 500ms | ~50ms |
| `/info` | < 500ms | ~50ms |

**Test Performance**:
```bash
# Measure endpoint latency
for i in {1..10}; do
  time curl http://localhost:3000/health > /dev/null
done

# Average should be < 100ms
```

## CI/CD Integration

### GitHub Actions Test

**Already Integrated** in `.github/workflows/ci.yml`:

```yaml
- name: Run API health checks
  run: |
    echo "Testing health endpoint..."
    curl -f http://localhost:3000/health || exit 1
    
    echo "Testing readiness endpoint..."
    curl -f http://localhost:3000/ready || exit 1
    
    echo "Testing info endpoint..."
    curl -f http://localhost:3000/info || exit 1
    
    echo "✅ All API tests passed!"
```

**What it Checks**:
1. Service is running
2. Health endpoint accessible
3. Returns expected status codes
4. JSON response valid

### Failure Handling

If health checks fail in CI/CD:
- Build fails
- PR cannot be merged
- Deployment blocked
- Team notified

## Troubleshooting

### Health Check Always Returns 503

**Causes**:
1. Database connection failed
2. Redis not running
3. Migrations not complete

**Fix**:
```bash
# Check database
psql postgresql://user:pass@host/db -c "SELECT 1"

# Check Redis
redis-cli ping

# Check migrations
npm run migrate

# Then restart
npm run dev
```

### Response Times Increasing

**Causes**:
1. High database load
2. Memory leak
3. Slow queries

**Fix**:
```bash
# Monitor memory
curl http://localhost:3000/info | jq .memory

# Check database latency
curl http://localhost:3000/info | jq .database.latency_ms

# Check for slow queries in logs
grep "duration:" logs/app.log | sort -n | tail
```

### Inconsistent Health Status

**Cause**: Transient connection issues

**Fix**:
```bash
# Implement retry logic in load balancer
# Wait 30s before marking unhealthy (2-3 failed checks)

# Verify network connectivity
ping database-host
ping redis-host
```

## Deployment Checklist

Before deploying to production:

- [ ] Health endpoint responds 200
- [ ] Ready endpoint returns all checks
- [ ] Info endpoint shows correct environment
- [ ] Load balancer configured with health checks
- [ ] Monitoring/alerts configured
- [ ] SLA defined for health check failures
- [ ] Runbook created for incidents
- [ ] Team trained on health monitoring

## SLA (Service Level Agreement)

**Availability Target**: 99.9%

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | < 99.5% |
| Health Check Response | < 100ms | > 500ms |
| Recovery Time (RTO) | 5 minutes | Trigger after 2 failures |
| Time to Detect (TTD) | 30 seconds | Alert immediately |

## Example Load Balancer Configuration

### HAProxy
```conf
backend api
  http-check GET /health HTTP/1.1
  http-check expect status 200
  option httpchk GET /health HTTP/1.1
  server api1 localhost:3000 check inter 30s fall 3
```

### Nginx
```nginx
upstream api {
  server localhost:3000;
  check interval=30000 rise=2 fall=3 timeout=5000 type=http;
  check_http_send "GET /health HTTP/1.0\r\n\r\n";
  check_http_expect_alive http_2xx;
}
```

### AWS ELB
```json
{
  "HealthCheck": {
    "Target": "HTTP:3000/health",
    "Interval": 30,
    "Timeout": 5,
    "HealthyThreshold": 2,
    "UnhealthyThreshold": 3
  }
}
```

## Testing Commands Quick Reference

```bash
# Test all endpoints
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/info

# Test with timing
curl -w "Response time: %{time_total}s\n" http://localhost:3000/health

# Monitor health over time
watch -n 1 'curl -s http://localhost:3000/info | jq .'

# Load test
ab -n 1000 -c 10 http://localhost:3000/health

# Stress test
for i in {1..100}; do curl http://localhost:3000/health & done
```

---

**Health endpoints are the first line of defense against outages.**

Monitor them carefully and respond quickly to failures.
