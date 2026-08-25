// CI performance budget gate (SDLC decision #9): fails the build if the
// production bundle grows more than the configured tolerance over the
// last deliberately-recorded baseline. Run after `npm run build`.
//
// Usage:
//   node scripts/check-bundle-budget.js                 # check dist/ against the budget
//   node scripts/check-bundle-budget.js --update-baseline  # record dist/'s current size as the new baseline

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { gzipSync } from 'zlib';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist', 'assets');
const budgetPath = join(__dirname, '..', 'performance-budget.json');

function gzipSizeOfDir(dir, ext) {
  let total = 0;
  for (const file of readdirSync(dir)) {
    if (extname(file) !== ext) continue;
    const contents = readFileSync(join(dir, file));
    total += gzipSync(contents).length;
  }
  return total;
}

const jsBytes = gzipSizeOfDir(distDir, '.js');
const cssBytes = gzipSizeOfDir(distDir, '.css');

const updateBaseline = process.argv.includes('--update-baseline');

if (updateBaseline) {
  const budget = {
    description:
      'Frontend production bundle size budget (gzipped). CI fails a PR if either total ' +
      'exceeds its baseline by more than toleranceRatio. Update this file deliberately ' +
      '(`npm run check:bundle-budget -- --update-baseline`) when a PR intentionally grows ' +
      'the bundle, so the change is visible in review rather than the budget silently ratcheting up.',
    updated: new Date().toISOString().slice(0, 10),
    toleranceRatio: 1.1,
    budgets: {
      js_gzip_bytes: jsBytes,
      css_gzip_bytes: cssBytes,
    },
  };
  writeFileSync(budgetPath, JSON.stringify(budget, null, 2) + '\n');
  console.log(`Baseline recorded: js=${jsBytes}B gzip, css=${cssBytes}B gzip`);
  process.exit(0);
}

const budget = JSON.parse(readFileSync(budgetPath, 'utf-8'));
const tolerance = budget.toleranceRatio;

const checks = [
  { name: 'JS', actual: jsBytes, limit: Math.round(budget.budgets.js_gzip_bytes * tolerance) },
  { name: 'CSS', actual: cssBytes, limit: Math.round(budget.budgets.css_gzip_bytes * tolerance) },
];

let failed = false;
for (const { name, actual, limit } of checks) {
  const pct = (((actual - budget.budgets[`${name === 'JS' ? 'js' : 'css'}_gzip_bytes`]) /
    budget.budgets[`${name === 'JS' ? 'js' : 'css'}_gzip_bytes`]) * 100).toFixed(1);
  const status = actual > limit ? 'FAIL' : 'ok';
  if (actual > limit) failed = true;
  console.log(
    `[${status}] ${name} bundle: ${actual}B gzip (baseline ${budget.budgets[`${name === 'JS' ? 'js' : 'css'}_gzip_bytes`]}B, ${pct >= 0 ? '+' : ''}${pct}%, limit ${limit}B)`
  );
}

if (failed) {
  console.error(
    '\nBundle size budget exceeded. If this growth is intentional, update the baseline ' +
      '(`npm run check:bundle-budget -- --update-baseline`) as part of this PR so the ' +
      'increase is visible in review.'
  );
  process.exit(1);
}

console.log('\nBundle size within budget.');
