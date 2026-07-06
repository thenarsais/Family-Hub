# Staging Environment Setup
## Local Staging Configuration for Testing Before Production

**Purpose:** Test application behavior in an environment that closely mimics production before deploying to actual production servers.

**Environment:** Local machine with separate docker-compose configuration running on different ports.

---

## 🎯 Quick Start

### Start Staging Environment

```bash
# Option 1: Using deployment script (recommended)
./scripts/deploy-staging.sh

# Option 2: Manual docker-compose
docker-compose -f docker-compose.staging.yml up -d
```

### Stop Staging Environment

```bash
docker-compose -f docker-compose.staging.yml down
```

### View Staging Logs

```bash
# All services
docker-compose -f docker-compose.staging.yml logs -f

# Specific service (e.g., api)
docker-compose -f docker-compose.staging.yml logs -f api
```

---

## 📊 Staging Services Configuration

All staging services run on **different ports** than local development to avoid conflicts.

| Service | Dev Port | Staging Port | Database | Notes |
|---------|----------|--------------|----------|-------|
| **API** | 3000 | 3100 | family_hub | Node.js backend |
| **PostgreSQL** | 5432 | 5433 | family_hub_staging | Separate staging database |
| **Redis** | 6379 | 6380 | - | Staging cache |
| **Elasticsearch** | 9200 | 9210 | - | Staging logs |
| **Kibana** | 5601 | 5610 | - | Staging log viewer |
| **Prometheus** | 9090 | 9091 | - | Staging metrics |
| **Grafana** | 3001 | 3011 | - | Staging dashboards (admin/admin) |

---

## 🚀 Accessing Staging Services

### API
```
URL: http://localhost:3100
Health Check: http://localhost:3100/health
```

### Monitoring & Logs
```
Prometheus: http://localhost:9091
Grafana: http://localhost:3011 (admin/admin)
Kibana: http://localhost:5610
```

### Databases
```
PostgreSQL: localhost:5433 (postgres/postgres, db: family_hub_staging)
Redis: localhost:6380
Elasticsearch: http://localhost:9210
```

---

## 📋 Common Staging Tasks

### Deploy to Staging

**Automated (recommended):**
```bash
./scripts/deploy-staging.sh
```

**Manual:**
```bash
# Build backend image
docker-compose -f docker-compose.staging.yml build api

# Stop existing staging
docker-compose -f docker-compose.staging.yml down

# Start staging
docker-compose -f docker-compose.staging.yml up -d

# Verify
docker-compose -f docker-compose.staging.yml ps
```

### Run Database Migrations on Staging

```bash
docker-compose -f docker-compose.staging.yml exec api npm run migrate
```

### Seed Staging Data

```bash
docker-compose -f docker-compose.staging.yml exec api npm run seed
```

### Connect to Staging Database

```bash
# Using psql
psql -h localhost -p 5433 -U postgres -d family_hub_staging

# Using docker
docker-compose -f docker-compose.staging.yml exec postgres psql -U postgres -d family_hub_staging
```

### View Staging API Logs

```bash
docker-compose -f docker-compose.staging.yml logs -f api
```

### Scale Staging Services

```bash
# Increase replicas (if needed)
docker-compose -f docker-compose.staging.yml up -d --scale api=3
```

---

## 🔄 Staging Workflow

### 1. Local Development
- Work on features locally (`docker-compose.yml`)
- Test on localhost:3000

### 2. Deploy to Staging
- Push code to staging branch
- Run deployment script: `./scripts/deploy-staging.sh`
- Services start on alternate ports (3100, 5433, etc.)

### 3. Test on Staging
- Run smoke tests
- Test critical workflows
- Check monitoring/logs
- Verify database operations

### 4. Ready for Production
- If staging tests pass → ready for production deployment
- If issues found → fix locally, redeploy to staging

---

## 🧪 Testing Staging Environment

### Smoke Test Checklist

```bash
# 1. API health check
curl http://localhost:3100/health

# 2. Database connectivity
docker-compose -f docker-compose.staging.yml exec postgres pg_isready -U postgres

# 3. Redis connectivity
docker-compose -f docker-compose.staging.yml exec redis redis-cli ping

# 4. Elasticsearch health
curl http://localhost:9210/_cluster/health

# 5. Prometheus metrics
curl http://localhost:9091/api/v1/targets

# 6. Check staging logs
docker-compose -f docker-compose.staging.yml logs api | tail -20
```

### Integration Test Checklist

- [ ] User login works
- [ ] Activity creation works
- [ ] Points awarded correctly
- [ ] Chore sync works bidirectionally
- [ ] Goals can be created and updated
- [ ] Badges unlock properly
- [ ] Reports generate correctly
- [ ] Notifications send
- [ ] Google Drive sync works

---

## 🔧 Troubleshooting Staging

### Staging services not starting

```bash
# Check what went wrong
docker-compose -f docker-compose.staging.yml logs

# Rebuild without cache
docker-compose -f docker-compose.staging.yml build --no-cache api

# Start fresh
docker-compose -f docker-compose.staging.yml down -v
docker-compose -f docker-compose.staging.yml up -d
```

### API keeps restarting on staging

```bash
# Check API logs
docker-compose -f docker-compose.staging.yml logs api

# Common issue: missing environment variables
# Check docker-compose.staging.yml for SUPABASE_URL and SUPABASE_ANON_KEY
```

### Port conflicts

If ports are already in use:
```bash
# Find what's using the port
lsof -i :3100  # macOS/Linux
netstat -ano | findstr :3100  # Windows

# Or change the port mapping in docker-compose.staging.yml
# Change "3100:3000" to "3101:3000" (next available port)
```

### Database issues

```bash
# Reset staging database
docker-compose -f docker-compose.staging.yml down -v

# Restart (will recreate databases)
docker-compose -f docker-compose.staging.yml up -d
```

---

## 📊 Staging vs Production Differences

| Aspect | Staging | Production |
|--------|---------|-----------|
| **Location** | Local machine | Cloud server/VM |
| **Data** | Test data | Real user data |
| **Scaling** | Single instance | Multi-instance |
| **Backups** | Not needed | Daily automated |
| **Monitoring** | Local dashboards | Cloud monitoring |
| **SSL/TLS** | Self-signed (optional) | Let's Encrypt |
| **Resource Limits** | None | CPU/Memory managed |

---

## 🚀 Deploying to Real Staging Server

When ready to deploy to an actual staging server:

1. **Provision VM** (AWS/Digital Ocean/etc.)
2. **Install Docker & Compose**
3. **Clone repository**
4. **Copy docker-compose.staging.yml**
5. **Configure environment variables** (.env.staging)
6. **Run:** `docker-compose -f docker-compose.staging.yml up -d`
7. **Verify services** with smoke tests

See **STAGING_SERVER_DEPLOYMENT.md** for remote server setup (Phase 1.5).

---

## 📚 Related Documentation

- [Local Development Setup](./LOCAL_DEV_SETUP.md) - Local dev environment
- [CI/CD Pipeline](./CI_CD_PIPELINE.md) - Automated testing & deployment
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Configuration reference
- [Deployment Guide](./HOW_TO_DEPLOY_PRODUCTION.md) - Production deployment

---

**Status:** Ready for Phase 1A  
**Last Updated:** July 6, 2026  
**Maintained By:** DevOps Team
