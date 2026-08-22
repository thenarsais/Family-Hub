// Fail-fast environment variable validation
// Validates REQUIRED vars at startup; prevents silent failures
//
// Was requiring SUPABASE_ANON_KEY and SUPABASE_SERVICE_KEY, names no other
// code in this app actually reads (everywhere else uses
// SUPABASE_SERVICE_ROLE_KEY, and the anon key isn't used at all) — CI had
// no reason to set either, so every server boot there failed this check
// before the port ever opened.

const requiredVars = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
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
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
};
