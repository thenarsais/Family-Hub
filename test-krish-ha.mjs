import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HA_URL = 'http://localhost:8123/local/krish-tasks/krish-daily-tasks.html?from=ha';
const outDir = path.join(__dirname, 'test-screenshots-ha');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

const issues = [];

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false });
}

async function check(label, fn) {
  try {
    await fn();
    console.log('✅', label);
  } catch (e) {
    console.log('❌', label, '—', e.message.split('\n')[0]);
    issues.push({ label, error: e.message.split('\n')[0] });
    await shot('error-' + label.replace(/[^a-z0-9]/gi, '_').slice(0, 40));
  }
}

// ── LOAD FROM HA ──────────────────────────────────────
console.log('Loading:', HA_URL);
await page.goto(HA_URL, { waitUntil: 'networkidle' });
await shot('01-ha-dashboard');

await check('Served from HA (not file://)', async () => {
  const url = page.url();
  if (!url.startsWith('http://localhost:8123')) throw new Error('Wrong origin: ' + url);
});

await check('FROM_HA flag set (no file:// path in URL)', async () => {
  const fromHa = await page.evaluate(() =>
    new URLSearchParams(window.location.search).get('from') === 'ha'
  );
  if (!fromHa) throw new Error('?from=ha not present');
});

await check('Dashboard renders greeting', async () => {
  await page.waitForSelector('#greeting-text', { timeout: 4000 });
  const text = await page.textContent('#greeting-text');
  if (!text.includes('Krish')) throw new Error('Got: ' + text);
});

await check('Dashboard renders all 7 bento cards', async () => {
  const cards = await page.$$('.db-card');
  if (cards.length < 7) throw new Error('Only ' + cards.length + ' cards found');
});

// ── KEY FIX: card HEADER tap opens Activity Board ─────
await check('Tapping Chores card HEADER opens Activity Board', async () => {
  // Click the header area (not the button) — this is the fix we just shipped
  await page.click('#db-chores-card .db-card-hdr');
  await page.waitForSelector('#view-board.active', { timeout: 3000 });
});
await shot('02-ha-board-from-header-tap');

await check('Activity Board: correct tab active (Chores)', async () => {
  const active = await page.$('.b-tab.active[data-tab="chores"]');
  if (!active) throw new Error('Chores tab not active');
});

// ── BACK BUTTON: should navigate to /family-hub in HA ─
await check('Back button navigates to HA dashboard', async () => {
  await page.click('.back-btn');
  // FROM_HA=true → window.top.location.href = '/family-hub'
  // This navigates away from the page — wait for URL to change
  await page.waitForURL('**/family-hub**', { timeout: 5000 });
});
await shot('03-ha-back-nav');

// Navigate back to the app for more tests
await page.goto(HA_URL, { waitUntil: 'networkidle' });

// ── TEST EACH CARD HEADER ─────────────────────────────
const headerTests = [
  ['#db-hw-card .db-card-hdr',     'homework'],
  ['#db-cal-card .db-card-hdr',    'calendar'],
  ['#db-kf-card .db-card-hdr',     'kungfu'],
  ['#db-habits-card .db-card-hdr', 'habits'],
  ['#db-mood-card .db-card-hdr',   'mood'],
  ['#db-guj-card .db-card-hdr',    'gujarati'],
  ['#db-pts-card',                 'points'],
];

for (const [selector, tab] of headerTests) {
  await check(`Header tap opens ${tab} tab`, async () => {
    // Make sure we're on dashboard
    if (await page.$('#view-board.active')) {
      await page.goto(HA_URL, { waitUntil: 'networkidle' });
    }
    await page.click(selector);
    await page.waitForSelector('#view-board.active', { timeout: 3000 });
    const active = await page.$('.b-tab.active[data-tab="' + tab + '"]');
    if (!active) throw new Error(tab + ' tab not active after header tap');
    await shot('tab-' + tab);
  });
}

// ── MOOD: all 5 visible (overflow fix) ───────────────
await check('Mood: all 5 emojis fully visible (no overflow)', async () => {
  await page.goto(HA_URL, { waitUntil: 'networkidle' });
  await page.click('#db-mood-card .db-card-hdr');
  await page.waitForSelector('#panel-mood.active', { timeout: 3000 });
  const opts = await page.$$('.mood-opt');
  if (opts.length !== 5) throw new Error('Expected 5, got ' + opts.length);
  // Check none are clipped outside viewport
  for (const opt of opts) {
    const box = await opt.boundingBox();
    if (!box) throw new Error('mood-opt has no bounding box');
    if (box.x + box.width > 395) throw new Error(`Emoji overflows right edge (x:${box.x} w:${box.width})`);
  }
});
await shot('04-mood-overflow-check');

// ── FINAL ─────────────────────────────────────────────
await browser.close();

console.log('\n══════════════════════════════════');
if (issues.length === 0) {
  console.log('All HA checks passed ✅');
} else {
  console.log(issues.length + ' issue(s):');
  issues.forEach(i => console.log(' •', i.label, '—', i.error));
}
console.log('Screenshots →', outDir);
