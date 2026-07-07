import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

// Load environment variables
// When running in Docker, these come from env_file in docker-compose.yml
// When running locally with npm run dev, load from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

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
// HEALTH CHECK
// ================================================

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
// ERROR HANDLER
// ================================================

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.ENVIRONMENT === 'development' ? err.message : undefined
  });
});

// ================================================
// START SERVER
// ================================================

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.ENVIRONMENT || 'unknown'}`);
  console.log(`   Health: GET /health`);
  console.log(`   Auth: POST /auth/signup, POST /auth/login, POST /auth/logout`);
  console.log(`   Users: GET /users, GET /users/:id, PUT /users/:id, DELETE /users/:id`);
});

export default app;
