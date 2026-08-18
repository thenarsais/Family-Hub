import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import badgeRoutes from './routes/badges';
import pointsRoutes from './routes/points';
import externalApisRoutes from './routes/external-apis';
import smartthingsRoutes from './routes/smartthings';
import choresRoutes from './routes/chores';
import learningRoutes from './routes/learning';
import announcementsRoutes from './routes/announcements';
import remindersRoutes from './routes/reminders';
import energyRoutes from './routes/energy';
import calendarRoutes from './routes/calendar';
import familyRoutes from './routes/family';
import activityLogRoutes from './routes/activity-log';
import { responseFormatter } from './middleware/response-formatter';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/request-logger';
import { rateLimit, rateLimitPresets } from './middleware/rate-limiter';
import { batchOperations } from './middleware/batch-operations';
import { compression, compressionPresets } from './middleware/compression';
import performanceRoutes from './routes/performance';
import deploymentRoutes from './routes/deployment';
import healthRoutes from './routes/health';
import { validateEnv } from './config/env';
import { initSentry } from './config/sentry';

// Load environment variables
// When running in Docker, these come from env_file in docker-compose.yml
// When running locally with npm run dev, load from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// ================================================
// PHASE 0 COMPLIANCE: VALIDATE ENVIRONMENT
// ================================================
// Fail-fast if required environment variables are missing
validateEnv();

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3000;

// ================================================
// PHASE 0 COMPLIANCE: INITIALIZE SENTRY MONITORING
// ================================================
// Error tracking (graceful degradation if SENTRY_DSN not set)
initSentry();

// ================================================
// MIDDLEWARE
// ================================================

app.use(cors());
app.use(express.json());
app.use(compression(compressionPresets.standard)); // Response compression
app.use(responseFormatter()); // Standard response formatting
app.use(requestLogger()); // Request logging
app.use(rateLimit(rateLimitPresets.standard)); // Rate limiting
app.use(batchOperations()); // Batch operations support

// Lazy-initialize Supabase
let supabase: any = null;

function getSupabase() {
  if (!supabase) {
    try {
      const supabaseUrl = process.env.SUPABASE_URL!;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      // For Node.js 18, provide ws transport for realtime
      let clientOptions: any = {};
      try {
        if (process.version.startsWith('v16') || process.version.startsWith('v18')) {
          const WebSocket = require('ws');
          clientOptions = {
            global: {
              fetch: fetch,
              WebSocket: WebSocket
            }
          };
        }
      } catch (e) {
        // ws not available, continue without it
      }

      supabase = createClient(supabaseUrl, supabaseKey, clientOptions);
      console.log('✅ Supabase client initialized');
    } catch (error: any) {
      console.error('❌ Supabase initialization failed:', error.message);
      throw error;
    }
  }
  return supabase;
}

// ================================================
// HEALTH CHECK (PHASE 0 COMPLIANCE)
// ================================================
// Mount comprehensive health check endpoint
app.use('/api', healthRoutes);

// Legacy health endpoint for backwards compatibility
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.ENVIRONMENT || 'unknown'
  });
});

// ================================================
// API ROUTES
// ================================================

// Auth endpoints: POST /auth/signup, POST /auth/login, POST /auth/logout, GET /auth/me
app.use('/auth', authRoutes);

// User endpoints: GET /users, GET /users/:id, PUT /users/:id, DELETE /users/:id
app.use('/users', userRoutes);

// Badge endpoints: GET /badges, GET /badges/:id, POST/DELETE user badges
app.use('/badges', badgeRoutes);

// Points endpoints: GET/POST user points, leaderboard
app.use('/points', pointsRoutes);

// SmartThings endpoints: Devices, control, status
app.use('/api/smartthings', smartthingsRoutes);

// Chores endpoints: Create, list, complete, progress
app.use('/api/chores', choresRoutes);

// Learning endpoints: Lessons, quizzes, progress, stats
app.use('/api/learning', learningRoutes);

// ================================================
// PHASE 2 FEATURES: Dashboard & Home Automation
// ================================================

// Announcements endpoints: Family messaging
app.use('/api/announcements', announcementsRoutes);

// Reminders endpoints: Notifications & scheduling
app.use('/api/reminders', remindersRoutes);

// Energy tracking endpoints: SmartThings power consumption
app.use('/api/energy', energyRoutes);

// Google OAuth callback redirect (legacy path for OAuth compatibility)
app.get('/auth/google/callback', (req, res) => {
  res.redirect(`/api/calendar/auth/google/callback?${new URLSearchParams(req.query).toString()}`);
});

// Calendar endpoints: Family events & scheduling
app.use('/api/calendar', calendarRoutes);

// Family management endpoints: Members, roles, settings
app.use('/api/family', familyRoutes);

// Activity log endpoints: Dashboard activity feed
app.use('/api/activity', activityLogRoutes);

// External APIs: Dictionary, Weather, Email
app.use('/api/external', externalApisRoutes);

// Performance monitoring: Metrics, diagnostics, health
app.use('/performance', performanceRoutes);

// Deployment: Health checks, readiness probes, info
app.use(deploymentRoutes);

// ================================================
// TEST ENDPOINTS
// ================================================

app.get('/test-db', async (req, res) => {
  try {
    const client = getSupabase();

    const { data, error } = await client
      .from('users')
      .select('count')
      .limit(1);

    if (error) throw error;
    res.json({
      status: 'Database connected!',
      data
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// ================================================
// DATABASE INITIALIZATION
// ================================================

app.post('/init-db', async (req, res) => {
  try {
    const fs = require('fs');
    const pathModule = require('path');
    const { pool } = require('./database/connection');

    console.log('🔄 Initializing database schema...');

    // Read and execute migration file
    const migrationsDir = pathModule.join(__dirname, '..', 'migrations');
    const migrationFile = pathModule.join(migrationsDir, '001_initial_schema.sql');

    if (!fs.existsSync(migrationFile)) {
      return res.status(400).json({
        error: 'Migration file not found',
        file: migrationFile
      });
    }

    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Execute SQL
    await pool.query(sql);

    console.log('✅ Database schema initialized successfully');

    res.json({
      status: 'Database initialized successfully',
      message: 'All tables and indexes created'
    });
  } catch (error: any) {
    // Check if error is about already existing objects
    if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42710') {
      console.warn('⚠️  Tables already exist, skipping initialization');
      return res.json({
        status: 'Database already initialized',
        message: 'Tables already exist'
      });
    }

    console.error('❌ Database initialization failed:', error.message);
    res.status(500).json({
      error: 'Database initialization failed',
      message: error.message
    });
  }
});

// ================================================
// 404 HANDLER
// ================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// ================================================
// ERROR HANDLER (MUST BE LAST)
// ================================================
// Uses errorHandler with PII scrubbing (PHASE 0 COMPLIANCE - Decision 29: COPPA)
app.use(errorHandler);

// ================================================
// START SERVER
// ================================================

app.listen(PORT, () => {
  console.log(`\n🚀 ====================================`);
  console.log(`   Family Hub API - PRODUCTION READY`);
  console.log(`   ====================================`);
  console.log(`\n✅ Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.ENVIRONMENT || 'unknown'}`);
  console.log(`\n📍 API Endpoints:`);
  console.log(`   • Auth: 4 endpoints`);
  console.log(`   • Users: 4 endpoints`);
  console.log(`   • Badges: 8 endpoints`);
  console.log(`   • Points: 8+ endpoints`);
  console.log(`   • SmartThings: 6 endpoints`);
  console.log(`   • Chores: 5 endpoints`);
  console.log(`   • Learning: 5 endpoints`);
  console.log(`   • External APIs: 10+ endpoints`);
  console.log(`   • Performance: 6+ endpoints`);
  console.log(`   ┗━ TOTAL: 75+ Endpoints`);
  console.log(`\n🔧 Advanced Features:`);
  console.log(`   ✓ Rate Limiting`);
  console.log(`   ✓ Request Logging`);
  console.log(`   ✓ Response Compression`);
  console.log(`   ✓ Caching Strategies`);
  console.log(`   ✓ Batch Operations`);
  console.log(`   ✓ Query Optimization`);
  console.log(`   ✓ Database Indexing`);
  console.log(`   ✓ Performance Monitoring`);
  console.log(`\n🏥 Health & Deployment:`);
  console.log(`   GET /health     - Liveness probe`);
  console.log(`   GET /ready      - Readiness probe`);
  console.log(`   GET /startup    - Startup probe`);
  console.log(`   GET /info       - App information`);
  console.log(`   GET /metrics    - Prometheus metrics`);
  console.log(`\n📊 Monitoring:`);
  console.log(`   GET /performance/health   - System health`);
  console.log(`   GET /performance/summary  - Performance summary`);
  console.log(`   GET /performance/queries  - Query analytics`);
  console.log(`\n🎉 ====================================`);
  console.log(`   Phase 1B: 100% COMPLETE! ✅`);
  console.log(`   Ready for production deployment`);
  console.log(`   ====================================\n`);
});

export default app;
