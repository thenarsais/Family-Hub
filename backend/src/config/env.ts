// Fail-fast environment variable validation
// Validates REQUIRED vars at startup; prevents silent failures

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'DATABASE_URL',
];

export function validateEnv(): void {
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    const message =
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Set these in .env file (copy from .env.example):\n` +
      `  cp .env.example .env`;
    throw new Error(message);
  }
}

export const config = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
  databaseUrl: process.env.DATABASE_URL,
};
