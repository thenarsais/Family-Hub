import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
// When running in Docker, these come from env_file in docker-compose.yml
// When running locally with npm run dev, load from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase (with fallback for Phase 1A development)
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'local-dev-key';

// Only create Supabase client if we have valid credentials
let supabase: any;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} catch (error: any) {
  console.warn('⚠️  Supabase initialization failed (Phase 1A placeholder):', error.message);
  // Create a dummy client for Phase 1A development
  console.log('   Using placeholder Supabase client for development');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Supabase not initialized',
        message: 'Phase 1A: Supabase will be configured in Phase 1B'
      });
    }

    const { data, error } = await supabase
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

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Test DB: http://localhost:${PORT}/test-db`);
});

export default app;
