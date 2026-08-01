// Fail-fast environment variable validation for frontend
// Validates REQUIRED vars at app startup; prevents silent failures

const requiredVars = [
  'VITE_API_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
];

export function validateEnv(): void {
  const missing = requiredVars.filter((v) => !import.meta.env[v]);

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    missing.forEach((v) => console.error(`  • ${v}`));
    console.error('\nSet these in .env file (copy from .env.example):\n');
    console.error('  cp .env.example .env\n');
    throw new Error('Missing required environment variables');
  }
}
