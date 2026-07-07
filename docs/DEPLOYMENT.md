# Deployment Guide
## Family Hub Backend - Production Deployment

**Last Updated:** 2026-07-07  
**Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Health Checks](#health-checks)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Monitoring & Logging](#monitoring--logging)
7. [Performance Tuning](#performance-tuning)
8. [Security Checklist](#security-checklist)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ (or Docker for containerized deployment)
- PostgreSQL 13+ database
- Redis 6+ for caching
- Supabase account with service role key
- Docker & Docker Compose (optional)
- Kubernetes cluster (optional)

---

## Environment Configuration

### Required Environment Variables

```bash
# Core
ENVIRONMENT=production
NODE_ENV=production
PORT=3000
API_URL=https://api.familyhub.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/familyhub
DB_POOL_SIZE=20
DB_CONNECTION_TIMEOUT=5000
DB_IDLE_TIMEOUT=30000

# Cache
REDIS_URL=redis://user:password@host:6379
REDIS_TTL=300

# Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Security
BCRYPT_ROUNDS=10
ALLOWED_ORIGINS=https://app.familyhub.com,https://www.familyhub.com
CORS_ORIGINS=https://app.familyhub.com,https://www.familyhub.com

# External APIs
MERRIAM_WEBSTER_API_KEY=your-key-here
OPENWEATHER_API_KEY=your-key-here
SENDGRID_API_KEY=your-key-here
SENDGRID_FROM_EMAIL=noreply@familyhub.com

# Performance
COMPRESSION_ENABLED=true
COMPRESSION_LEVEL=6
COMPRESSION_THRESHOLD=1024
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Versioning
API_VERSION=1.0.0
```

### Environment Variable Security

- **Never commit** `.env` files to git
- Use **AWS Secrets Manager**, **HashiCorp Vault**, or similar in production
- Rotate secrets regularly
- Audit access to secrets
- Use separate keys for staging/production

---

## Health Checks

### Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health` | Liveness probe | Returns `200` if running |
| `GET /ready` | Readiness probe | Returns `200` if ready to serve |
| `GET /startup` | Startup probe | Returns `200` after initialization |
| `GET /metrics` | Prometheus metrics | Prometheus format metrics |
| `GET /info` | Application info | Version, uptime, endpoints |

### Check Current Status

```bash
curl http://localhost:3000/health
# Returns: {"status":"ok","timestamp":"...","uptime":123.45}

curl http://localhost:3000/ready
# Returns readiness status with all checks

curl http://localhost:3000/metrics
# Returns Prometheus metrics
```

---

## Docker Deployment

### Build Image

```bash
docker build -t familyhub-api:latest .
docker tag familyhub-api:latest familyhub-api:1.0.0
```

### Run Container

```bash
docker run \
  --env-file .env.production \
  -p 3000:3000 \
  --health-cmd="curl -f http://localhost:3000/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  familyhub-api:latest
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    image: familyhub-api:latest
    container_name: family-hub-api
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: familyhub
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## Kubernetes Deployment

### ConfigMap (Non-sensitive config)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: familyhub-config
  namespace: production
data:
  ENVIRONMENT: "production"
  NODE_ENV: "production"
  PORT: "3000"
  API_VERSION: "1.0.0"
```

### Secret (Sensitive data)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: familyhub-secrets
  namespace: production
type: Opaque
stringData:
  SUPABASE_URL: "https://your-project.supabase.co"
  SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  DATABASE_URL: "postgresql://..."
  REDIS_URL: "redis://..."
  JWT_SECRET: "your-secret-key"
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: familyhub-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: familyhub-api
  template:
    metadata:
      labels:
        app: familyhub-api
    spec:
      containers:
      - name: api
        image: familyhub-api:1.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: familyhub-config
        - secretRef:
            name: familyhub-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        startupProbe:
          httpGet:
            path: /startup
            port: 3000
          failureThreshold: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: familyhub-api
  namespace: production
spec:
  selector:
    app: familyhub-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Monitoring & Logging

### Log Levels

```bash
# Development
ENVIRONMENT=development  # Shows all logs

# Production
ENVIRONMENT=production   # Error and warning only
```

### Log Aggregation

Logs should be forwarded to:
- Datadog
- Splunk
- ELK Stack
- CloudWatch
- GCP Logging

### Performance Monitoring

```bash
curl http://localhost:3000/performance/summary
# Returns query, request, and compression statistics

curl http://localhost:3000/performance/health
# Returns detailed health metrics
```

### Prometheus Metrics

```bash
curl http://localhost:3000/metrics
# Format: Prometheus text format
# Includes: uptime, memory usage, Node.js version
```

---

## Performance Tuning

### Database Optimization

1. Create recommended indexes:
   ```bash
   curl -X POST http://localhost:3000/performance/index-sql
   ```

2. Monitor query performance:
   ```bash
   curl http://localhost:3000/performance/queries
   ```

3. Check for N+1 queries:
   ```bash
   curl http://localhost:3000/performance/queries/n-plus-one
   ```

### Caching Strategy

- Set `REDIS_TTL=300` for 5-minute cache
- Increase for stable data
- Monitor cache hit rates

### Compression

- Enable: `COMPRESSION_ENABLED=true`
- Level: `COMPRESSION_LEVEL=6` (balance speed/compression)
- Threshold: `COMPRESSION_THRESHOLD=1024` (min size to compress)

### Rate Limiting

- Window: `RATE_LIMIT_WINDOW_MS=900000` (15 min)
- Requests: `RATE_LIMIT_MAX_REQUESTS=100` per window

---

## Security Checklist

- [ ] All environment variables set and validated
- [ ] JWT_SECRET changed from default
- [ ] CORS_ORIGINS restricted to production domains
- [ ] HTTPS enabled (TLS 1.2+)
- [ ] SSL certificates from trusted CA
- [ ] HSTS headers enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens (if applicable)
- [ ] Secrets rotated regularly
- [ ] Audit logging enabled
- [ ] Access logs monitored

---

## Deployment Steps

### 1. Pre-deployment Checks

```bash
npm run build        # Build TypeScript
npm run test         # Run tests (if available)
npm run lint         # Lint code
```

### 2. Database Migrations

```bash
npm run migrate      # Apply all pending migrations
```

### 3. Create Backup

```bash
# Backup current database
pg_dump familyhub > backup-$(date +%s).sql
```

### 4. Deploy API

```bash
# Option 1: Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Option 2: Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/familyhub-api -n production

# Option 3: Direct
npm run build && npm start
```

### 5. Verify Deployment

```bash
# Check health
curl https://api.familyhub.com/health

# Check readiness
curl https://api.familyhub.com/ready

# Check info
curl https://api.familyhub.com/info

# Monitor logs
docker logs family-hub-api
# or
kubectl logs -f deployment/familyhub-api -n production
```

### 6. Smoke Tests

```bash
# Test key endpoints
curl https://api.familyhub.com/health
curl https://api.familyhub.com/badges
curl https://api.familyhub.com/performance/health
```

---

## Rollback Procedure

If deployment fails:

```bash
# Docker Compose
docker-compose down
docker-compose -f docker-compose.prod.yml.backup up -d

# Kubernetes
kubectl rollout undo deployment/familyhub-api -n production

# Direct
git checkout previous-version
npm run build && npm start
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs family-hub-api

# Check environment variables
docker exec family-hub-api env

# Verify database connection
docker exec family-hub-api curl -f http://localhost:3000/ready
```

### High memory usage

```bash
# Check memory metrics
curl http://localhost:3000/metrics | grep memory

# Reduce pool sizes
DB_POOL_SIZE=10
REDIS_TTL=60
```

### Slow queries

```bash
# Get slow query analysis
curl http://localhost:3000/performance/queries/slow

# Get recommendations
curl http://localhost:3000/performance/queries
```

### Rate limit issues

Adjust limits based on load:

```bash
RATE_LIMIT_MAX_REQUESTS=500  # Increase limit
RATE_LIMIT_WINDOW_MS=60000   # Shorter window
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Redis configured
- [ ] Health checks responding
- [ ] Metrics endpoint working
- [ ] Logs aggregating
- [ ] Monitoring alerts set up
- [ ] Backup/restore tested
- [ ] Rollback plan documented
- [ ] Team trained on deployment
- [ ] On-call runbook prepared
- [ ] Load testing completed

---

## Support

For deployment issues, refer to:
- [API Documentation](./API_ENDPOINTS_COMPLETE.md)
- [Testing Guide](./TESTING_API.md)
- [Architecture Guide](../backend/README.md)

---

**Status:** Production Ready ✅  
**Last Tested:** 2026-07-07  
**Next Review:** 2026-07-14
