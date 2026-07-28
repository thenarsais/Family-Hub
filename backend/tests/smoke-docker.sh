#!/bin/bash

# Smoke Test Suite - Docker Version
# Runs from within Docker containers for better reliability

echo "🧪 FAMILY HUB SMOKE TESTS (Docker)"
echo "===================================="
echo ""

PASSED=0
FAILED=0

# ================================================
# TEST 1: API Health Check
# ================================================
echo "Testing API Health..."
if curl -s http://localhost:3000/health | grep -q '"status":"ok"'; then
  echo "✅ API Health Check"
  ((PASSED++))
else
  echo "❌ API Health Check"
  ((FAILED++))
fi

# ================================================
# TEST 2: Database Connectivity
# ================================================
echo "Testing Database..."
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "✅ Database Connectivity"
  ((PASSED++))
else
  echo "❌ Database Connectivity"
  ((FAILED++))
fi

# ================================================
# TEST 3: Database Tables
# ================================================
echo "Testing Database Schema..."
TABLE_COUNT=$(docker-compose exec -T postgres psql -U postgres -d family_hub -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs)
if [ "$TABLE_COUNT" = "39" ]; then
  echo "✅ Database Schema ($TABLE_COUNT tables)"
  ((PASSED++))
else
  echo "❌ Database Schema ($TABLE_COUNT tables, expected 39)"
  ((FAILED++))
fi

# ================================================
# TEST 4: Feature Flags & Badges
# ================================================
echo "Testing Seed Data..."
FLAG_COUNT=$(docker-compose exec -T postgres psql -U postgres -d family_hub -t -c "SELECT COUNT(*) FROM feature_flags;" 2>/dev/null | xargs)
BADGE_COUNT=$(docker-compose exec -T postgres psql -U postgres -d family_hub -t -c "SELECT COUNT(*) FROM badges;" 2>/dev/null | xargs)
if [ "$FLAG_COUNT" -ge 22 ] && [ "$BADGE_COUNT" -ge 20 ]; then
  echo "✅ Seed Data ($FLAG_COUNT flags, $BADGE_COUNT badges)"
  ((PASSED++))
else
  echo "❌ Seed Data ($FLAG_COUNT flags, $BADGE_COUNT badges)"
  ((FAILED++))
fi

# ================================================
# TEST 5: Redis
# ================================================
echo "Testing Redis..."
if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
  echo "✅ Redis Connectivity"
  ((PASSED++))
else
  echo "❌ Redis Connectivity"
  ((FAILED++))
fi

# ================================================
# TEST 6: Elasticsearch
# ================================================
echo "Testing Elasticsearch..."
if curl -s http://localhost:9200/_cluster/health 2>/dev/null | grep -q '"status":"green"'; then
  echo "✅ Elasticsearch Connectivity"
  ((PASSED++))
else
  echo "❌ Elasticsearch Connectivity"
  ((FAILED++))
fi

# ================================================
# TEST 7: Prometheus
# ================================================
echo "Testing Prometheus..."
if curl -s http://localhost:9090/-/healthy > /dev/null 2>&1; then
  echo "✅ Prometheus Health"
  ((PASSED++))
else
  echo "⚠️  Prometheus Health (not critical)"
fi

# ================================================
# REPORT
# ================================================
echo ""
echo "===================================="
echo "📊 SMOKE TEST REPORT"
echo "===================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Total: 7"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All critical tests passed!"
  echo "System is operational and ready for deployment."
  exit 0
else
  echo "❌ Some tests failed"
  exit 1
fi
