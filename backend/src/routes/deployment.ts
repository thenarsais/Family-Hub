/**
 * Deployment Routes
 * Health checks and readiness probes for orchestration
 */

import { Router, Request, Response } from 'express';
import { runReadinessChecks, isAlive } from '../utils/readiness';

const router = Router();

/**
 * GET /health
 * Liveness probe - is the process running?
 * Used by Docker, Kubernetes, load balancers to detect dead containers
 */
router.get('/health', (req: Request, res: Response) => {
  if (!isAlive()) {
    return res.status(503).json({
      status: 'unavailable',
      message: 'Process is not alive'
    });
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.ENVIRONMENT || 'unknown',
    uptime: process.uptime(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

/**
 * GET /ready
 * Readiness probe - is the service ready to accept traffic?
 * Used by Kubernetes to route traffic only to ready instances
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const readiness = await runReadinessChecks();

    if (!readiness.ready) {
      return res.status(503).json({
        status: 'not_ready',
        timestamp: readiness.timestamp,
        checks: readiness.checks,
        summary: readiness.summary
      });
    }

    res.json({
      status: 'ready',
      timestamp: readiness.timestamp,
      checks: readiness.checks,
      summary: readiness.summary
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /startup
 * Startup probe - has the application finished initializing?
 * Used by Kubernetes to wait for initialization before liveness checks
 */
router.get('/startup', async (req: Request, res: Response) => {
  const uptime = process.uptime();
  const readiness = await runReadinessChecks();

  // Application is considered started after 5 seconds
  const isStarted = uptime > 5 && readiness.summary.unhealthy === 0;

  if (!isStarted) {
    return res.status(503).json({
      status: 'starting',
      uptime,
      checks: readiness.checks,
      summary: readiness.summary
    });
  }

  res.json({
    status: 'started',
    uptime,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /metrics
 * Prometheus-style metrics endpoint
 */
router.get('/metrics', (req: Request, res: Response) => {
  const uptime = process.uptime();
  const mem = process.memoryUsage();

  const metrics = `
# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${uptime}

# HELP process_memory_heap_bytes Process heap memory in bytes
# TYPE process_memory_heap_bytes gauge
process_memory_heap_bytes ${mem.heapUsed}

# HELP process_memory_heap_total_bytes Process total heap memory in bytes
# TYPE process_memory_heap_total_bytes gauge
process_memory_heap_total_bytes ${mem.heapTotal}

# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}"} 1
`;

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

/**
 * GET /info
 * Application information
 */
router.get('/info', (req: Request, res: Response) => {
  res.json({
    application: 'Family Hub API',
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.ENVIRONMENT || 'unknown',
    node: process.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: 4,
      users: 4,
      badges: 8,
      points: 8,
      external_apis: 10,
      performance: 6,
      total: 60
    },
    features: [
      'Rate Limiting',
      'Request Logging',
      'Response Compression',
      'Caching',
      'Batch Operations',
      'Performance Monitoring',
      'Query Optimization',
      'Database Indexing',
      'Deployment Ready'
    ]
  });
});

/**
 * GET /config (development only)
 * Show current configuration (development only for debugging)
 */
router.get('/config', (req: Request, res: Response) => {
  if (process.env.ENVIRONMENT === 'production') {
    return res.status(403).json({
      error: 'Configuration not available in production'
    });
  }

  res.json({
    environment: process.env.ENVIRONMENT,
    port: process.env.PORT || process.env.API_PORT,
    database: {
      url: process.env.DATABASE_URL ? '[configured]' : '[not set]',
      poolSize: process.env.DB_POOL_SIZE || 'default'
    },
    redis: {
      url: process.env.REDIS_URL ? '[configured]' : '[not set]'
    },
    supabase: {
      url: process.env.SUPABASE_URL ? '[configured]' : '[not set]',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY ? '[configured]' : '[not set]'
    },
    cors: {
      origins: process.env.CORS_ORIGINS || 'localhost'
    }
  });
});

export default router;
