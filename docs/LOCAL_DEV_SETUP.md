# Local Development Setup
## Getting Family Hub Running Locally with Docker

**Prerequisites:**
- Docker Desktop installed (macOS, Windows, Linux)
- Docker Compose included with Docker Desktop
- Git for cloning the repository
- 4GB RAM minimum available

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Clone repository (if not already done)
git clone https://github.com/yourorg/family-hub.git
cd family-hub

# 2. Start all services
docker-compose up -d

# 3. Wait for services to start (20-30 seconds)
docker-compose ps

# 4. Services ready when all show "healthy" or "Up"
```

**Access services:**
- **API:** http://localhost:3000
- **Kibana (logs):** http://localhost:5601
- **Prometheus (metrics):** http://localhost:9090
- **Grafana (dashboards):** http://localhost:3001 (admin/admin)
- **PostgreSQL:** localhost:5432 (postgres/postgres)
- **Redis:** localhost:6379

---

## 📋 What Gets Started

### Core Services
- **api** - Backend API (Node.js/TypeScript)
  - Listens on port 3000
  - Auto-reloads code changes from `backend/src`
  - Health check: GET /health

- **postgres** - Database
  - PostgreSQL 15 Alpine
  - Database: family_hub
  - User: postgres / Password: postgres
  - Port: 5432
  - Data persisted in `postgres_data` volume

- **redis** - Cache
  - Redis 7 Alpine
  - Port: 6379
  - Data persisted in `redis_data` volume

### Monitoring & Logging
- **elasticsearch** - Log storage
  - Port: 9200
  - Single node setup (for development)

- **kibana** - Log viewer
  - Port: 5601
  - Query and visualize logs from Elasticsearch

- **logstash** - Log pipeline
  - Listens on port 5000 (TCP)
  - Forwards logs to Elasticsearch

- **prometheus** - Metrics collection
  - Port: 9090
  - Scrapes API metrics every 15 seconds

- **grafana** - Dashboards
  - Port: 3001
  - Default login: admin / admin
  - Connects to Prometheus

---

## 🔧 Common Commands

### Start services
```bash
docker-compose up -d
# or with logs
docker-compose up
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Single service
docker-compose logs -f api
docker-compose logs -f postgres
```

### Rebuild after code changes
```bash
docker-compose build api
docker-compose up -d api
```

### Database commands
```bash
# Access database shell
docker-compose exec postgres psql -U postgres -d family_hub

# Run migrations
docker-compose exec api npm run migrate

# Seed data
docker-compose exec api npm run seed:all
```

### Clean up volumes (WARNING: deletes data)
```bash
docker-compose down -v
```

---

## 📝 Environment Variables

Local development uses Docker Compose defaults:
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/family_hub`
- `REDIS_URL=redis://redis:6379`
- `LOG_LEVEL=info`

To customize, create `.env` file in root:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/family_hub
REDIS_URL=redis://redis:6379
LOG_LEVEL=debug  # or info, warn, error
```

---

## 🔍 Health Checks

Verify all services are running:
```bash
docker-compose ps
```

Expected output:
```
NAME                    STATUS
family-hub-api          Up 2 minutes (healthy)
family-hub-postgres     Up 2 minutes (healthy)
family-hub-redis        Up 2 minutes (healthy)
family-hub-elasticsearch Up 2 minutes
family-hub-kibana       Up 2 minutes (healthy)
family-hub-logstash     Up 2 minutes
family-hub-prometheus   Up 2 minutes (healthy)
family-hub-grafana      Up 2 minutes (healthy)
```

Individual service health:
```bash
# API health check
curl http://localhost:3000/health

# Database connection
docker-compose exec postgres pg_isready -U postgres

# Redis connection
docker-compose exec redis redis-cli ping

# Elasticsearch status
curl http://localhost:9200/_cluster/health
```

---

## 🚨 Troubleshooting

### Services won't start
```bash
# Check Docker daemon is running
docker ps

# Check for port conflicts
docker-compose ps
# If shows "error" or "exited", check logs:
docker-compose logs api
```

### Database connection errors
```bash
# Verify postgres is healthy
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Clear data and restart fresh
docker-compose down -v
docker-compose up postgres  # Wait for healthy
```

### Out of memory errors
```bash
# Increase Docker Desktop memory allocation
# Docker Desktop → Preferences → Resources → Memory (increase to 6GB+)

# Or stop unused services
docker-compose down elasticsearch kibana logstash
```

### Port already in use
```bash
# Find what's using the port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Or change docker-compose port mapping
# Edit docker-compose.yml: change "3000:3000" to "3001:3000"
docker-compose up -d
```

### Changes not being picked up
```bash
# Rebuild API image
docker-compose build --no-cache api
docker-compose up -d api

# Or restart
docker-compose restart api
```

---

## 📊 Accessing Monitoring Tools

### Kibana (Logs)
1. Open http://localhost:5601
2. Create index pattern: `family-hub-logs-*`
3. View logs in "Discover" tab

### Prometheus (Metrics)
1. Open http://localhost:9090
2. Query examples:
   - `http_request_duration_seconds`
   - `http_requests_total`
   - `db_query_duration_seconds`

### Grafana (Dashboards)
1. Open http://localhost:3001
2. Login: admin / admin
3. Add Prometheus data source
4. Create or import dashboards

---

## 🧹 Cleanup

### Stop all services (keep volumes)
```bash
docker-compose stop
```

### Remove all containers (keep volumes)
```bash
docker-compose down
```

### Remove everything including data
```bash
docker-compose down -v
```

### Prune unused images/volumes
```bash
docker system prune -a
```

---

## 🎯 Next Steps

1. **Verify all services running:** `docker-compose ps`
2. **Check API health:** `curl http://localhost:3000/health`
3. **Load seed data:** `docker-compose exec api npm run seed:all`
4. **Run tests:** `docker-compose exec api npm test`
5. **Start developing!**

---

## 📚 Related Documentation
- [API Documentation](../API.md) - Full API endpoints
- [Database Schema](../DATABASE.md) - 38-table schema
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Configuration options
- [CI/CD Pipeline](./CI_CD_PIPELINE.md) - Deployment procedures

---

**Status:** Ready to use  
**Last Updated:** July 6, 2026  
**Docker Compose Version:** 3.8+
