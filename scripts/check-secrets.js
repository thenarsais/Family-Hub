#!/usr/bin/env node
/**
 * Pre-commit secret scan.
 *
 * This repo has leaked real Supabase credentials into git history at least
 * three separate times (commits cf173e7, d8e0816, b4667c8/455a2c8) — each
 * time cleaned up reactively after the fact, never prevented. This hook is
 * the prevention: it inspects only the *newly added* lines in staged
 * changes and blocks the commit if they look like a real credential.
 */
const { execSync } = require('child_process');

const PATTERNS = [
  { name: 'Supabase service-role key', re: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: 'Postgres connection string with an inline password', re: /postgres(?:ql)?:\/\/[A-Za-z0-9._-]+:[^@\s\['"]{4,}@/ },
  { name: 'Credential assigned to a literal string instead of process.env', re: /(SUPABASE_(SERVICE_ROLE_)?KEY|DATABASE_URL|DB_PASSWORD)\s*[:=]\s*['"][^'"]{6,}['"]/ },
];

// Placeholders are fine — don't block on obvious examples.
const PLACEHOLDER = /\[YOUR[-_]?PASSWORD\]|YOUR_PASSWORD|xxx+|placeholder|example\.com|<[^>]+>/i;

function stagedFiles() {
  return execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split('\n')
    .map(f => f.trim())
    .filter(Boolean)
    .filter(f => !/\.(lock|lockb)$/.test(f) && f !== 'package-lock.json');
}

function addedLines(file) {
  let diff;
  try {
    diff = execSync(`git diff --cached -U0 -- "${file}"`, { encoding: 'utf8' });
  } catch {
    return [];
  }
  return diff
    .split('\n')
    .filter(l => l.startsWith('+') && !l.startsWith('+++'))
    .map(l => l.slice(1));
}

let violations = [];

for (const file of stagedFiles()) {
  for (const line of addedLines(file)) {
    if (PLACEHOLDER.test(line)) continue;
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) {
        violations.push({ file, name, line: line.trim().slice(0, 120) });
      }
    }
  }
}

if (violations.length) {
  console.error('\n🛑 COMMIT BLOCKED — possible real credential in staged changes:\n');
  for (const v of violations) {
    console.error(`  ${v.file}\n    [${v.name}] ${v.line}\n`);
  }
  console.error('If this is genuinely safe (a placeholder, a test fixture), rewrite the line so it');
  console.error('does not match the pattern above, or read the value from process.env instead.\n');
  console.error('Do NOT bypass this with --no-verify unless you are certain — this exact mistake');
  console.error('has happened before in this repo and ended up on the public GitHub remote.\n');
  process.exit(1);
}

process.exit(0);
