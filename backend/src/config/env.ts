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
    console.error('\n❌ Missing required environment variables:\n');
    missing.forEach((v) => console.error(`  • ${v}`));
    console.error('\nSet these in .env file (copy from .env.example):\n');
    console.error('  cp .env.example .env\n');
    process.exit(1);
  }
}
