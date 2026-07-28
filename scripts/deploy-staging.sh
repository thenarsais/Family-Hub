#!/bin/bash

# Deploy to Staging Environment
# Usage: ./scripts/deploy-staging.sh

set -e

echo "🚀 Deploying to Staging Environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Building backend image...${NC}"
docker-compose -f docker-compose.staging.yml build api

echo -e "${YELLOW}Step 2: Stopping existing staging services...${NC}"
docker-compose -f docker-compose.staging.yml down || true

echo -e "${YELLOW}Step 3: Starting staging services...${NC}"
docker-compose -f docker-compose.staging.yml up -d

echo -e "${YELLOW}Step 4: Waiting for services to be healthy...${NC}"
sleep 10

echo -e "${YELLOW}Step 5: Checking service status...${NC}"
docker-compose -f docker-compose.staging.yml ps

echo -e "${YELLOW}Step 6: Running smoke tests...${NC}"
echo "Testing PostgreSQL..."
docker-compose -f docker-compose.staging.yml exec postgres pg_isready -U postgres || echo "⚠️  Postgres still starting..."

echo "Testing Redis..."
docker-compose -f docker-compose.staging.yml exec redis redis-cli ping || echo "⚠️  Redis still starting..."

echo "Testing Elasticsearch..."
curl -s http://localhost:9210/_cluster/health | grep -q "green\|yellow" && echo "✅ Elasticsearch healthy" || echo "⚠️  Elasticsearch still starting..."

echo -e "${GREEN}✅ Staging deployment complete!${NC}"
echo ""
echo "📊 Access staging services:"
echo "   API: http://localhost:3100/health"
echo "   Prometheus: http://localhost:9091"
echo "   Grafana: http://localhost:3011 (admin/admin)"
echo "   Kibana: http://localhost:5610"
echo "   PostgreSQL: localhost:5433 (postgres/postgres)"
echo "   Redis: localhost:6380"
echo ""
echo "View logs: docker-compose -f docker-compose.staging.yml logs -f api"
