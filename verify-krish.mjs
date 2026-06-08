/**
 * Verification script for:
 *   b231b4c — card headers open Activity Board on tap
 *   93de89d — mood grid overflow fix (minmax(0,1fr))
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HA_URL = 'http://localhost:8123/local/krish-tasks/krish-daily-tasks.html?from=ha';
const OUT = path.join(__dirname, 'verify-screenshots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });

let step = 0;
function nextStep(label) {
  step++;
  console.log(`\nStep ${step}: ${label}`);
}

async function shot(name) {
  const file = path.join(OUT, `${String(step).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file });
  return file;
}

// ─────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────
await page.goto(HA_URL, { waitUntil: 'networkidle' });
await page.waitForSelector('#view-dashboard.active', { timeout: 5000 });

// ─────────────────────────────────────────────────────────
// CLAIM 1: Dashboard renders
// ─────────────────────────────────────────────────────────
nextStep('Dashboard loads from HA');
const greeting = await page.textContent('#greeting-text');
console.log('  greeting:', greeting);
const cardCount = (await page.$$('.db-card')).length;
console.log('  bento cards:', cardCount);
const f1 = await shot('dashboard');
console.log('  screenshot:', f1);

// ─────────────────────────────────────────────────────────
// CLAIM 2: Card BODY tap was the old broken path — verify it still does nothing
//          (interactive chore rows should toggle, not navigate)
// ─────────────────────────────────────────────────────────
nextStep('Tapping chore ROW toggles chore (not navigate to board)');
const ptsBefore = await page.textContent('#hdr-pts');
await page.click('.db-chore-row >> nth=0');
await page.waitForTimeout(300);
const ptsAfter = await page.textContent('#hdr-pts');
const onDash = await page.$('#view-dashboard.active');
console.log('  pts before:', ptsBefore, '→ after:', ptsAfter);
console.log('  still on dashboard:', !!onDash);
const f2 = await shot('chore-toggle');
console.log('  screenshot:', f2);

// ─────────────────────────────────────────────────────────
// CLAIM 3 (b231b4c): Tapping card HEADER opens Activity Board
// ─────────────────────────────────────────────────────────
const headerTargets = [
  { selector: '#db-chores-card .db-card-hdr',   tab: 'chores',   label: 'Chores header' },
  { selector: '#db-hw-card .db-card-hdr',        tab: 'homework', label: 'Homework header' },
  { selector: '#db-cal-card .db-card-hdr',       tab: 'calendar', label: 'Calendar header' },
  { selector: '#db-kf-card .db-card-hdr',        tab: 'kungfu',   label: 'Kung Fu header' },
  { selector: '#db-habits-card .db-card-hdr',    tab: 'habits',   label: 'Habits header' },
  { selector: '#db-mood-card .db-card-hdr',      tab: 'mood',     label: 'Mood header' },
  { selector: '#db-guj-card .db-card-hdr',       tab: 'gujarati', label: 'Gujarati header' },
  { selector: '#db-pts-card',                    tab: 'points',   label: 'Points card' },
];

for (const { selector, tab, label } of headerTargets) {
  nextStep(`${label} → opens ${tab} tab`);
  // Return to dashboard
  await page.evaluate(() => {
    document.getElementById('view-dashboard').classList.add('active');
    document.getElementById('view-board').classList.remove('active');
  });
  await page.waitForSelector('#view-dashboard.active');

  await page.click(selector);
  await page.waitForSelector('#view-board.active', { timeout: 3000 });
  const activeTab = await page.$eval('.b-tab.active', el => el.dataset.tab).catch(() => 'none');
  const correctTab = activeTab === tab;
  console.log(`  board opened: ✅  active tab: ${activeTab} ${correctTab ? '✅' : '❌'}`);
  if (!correctTab) console.log(`  EXPECTED: ${tab}`);
  await shot(`header-${tab}`);
}

// ─────────────────────────────────────────────────────────
// CLAIM 4 (93de89d): Mood grid — all 5 cells within viewport
// ─────────────────────────────────────────────────────────
nextStep('Mood grid: all 5 emoji within 390px viewport (no overflow)');
// navigate to mood tab
await page.evaluate(() => {
  document.getElementById('view-dashboard').classList.add('active');
  document.getElementById('view-board').classList.remove('active');
});
await page.click('#db-mood-card .db-card-hdr');
await page.waitForSelector('#panel-mood.active', { timeout: 3000 });
await shot('mood-panel');

const boxes = await page.$$eval('.mood-opt', els =>
  els.map(el => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), w: Math.round(r.width), right: Math.round(r.right), label: el.querySelector('.mood-lbl')?.textContent };
  })
);
let overflowFound = false;
boxes.forEach(b => {
  const overflow = b.right > 390;
  console.log(`  ${b.label?.padEnd(8)} x=${b.x} w=${b.w} right=${b.right} ${overflow ? '❌ OVERFLOW' : '✅'}`);
  if (overflow) overflowFound = true;
});

// ─────────────────────────────────────────────────────────
// PROBES
// ─────────────────────────────────────────────────────────
nextStep('🔍 Probe: double-tap header — board stays open, no crash');
await page.evaluate(() => {
  document.getElementById('view-dashboard').classList.add('active');
  document.getElementById('view-board').classList.remove('active');
});
await page.click('#db-chores-card .db-card-hdr');
await page.waitForSelector('#view-board.active', { timeout: 2000 });
// tap header again (now we're on the board — header is gone, nothing to click)
// instead simulate rapid double-click on dashboard then board path
await page.evaluate(() => window.showBoard('chores'));
await page.waitForTimeout(200);
const boardStillActive = !!(await page.$('#view-board.active'));
console.log('  board still active after second showBoard call:', boardStillActive ? '✅' : '❌');

nextStep('🔍 Probe: Chores tab — tick a chore, points increment');
const boardPtsBefore = await page.textContent('#board-pts-chip').catch(() => '?');
await page.click('.chore-item >> nth=0');
await page.waitForTimeout(300);
const boardPtsAfter = await page.textContent('#board-pts-chip').catch(() => '?');
console.log('  pts chip:', boardPtsBefore, '→', boardPtsAfter);
console.log('  points changed:', boardPtsBefore !== boardPtsAfter ? '✅' : '❌ (no change)');
await shot('chore-ticked');

nextStep('🔍 Probe: Mood selection awards points');
await page.evaluate(() => window.switchTab('mood'));
await page.waitForSelector('#panel-mood.active', { timeout: 2000 });
const moodPtsBefore = await page.textContent('#board-pts-chip');
await page.click('.mood-opt >> nth=0');
await page.waitForTimeout(300);
const moodPtsAfter = await page.textContent('#board-pts-chip');
console.log('  pts chip:', moodPtsBefore, '→', moodPtsAfter);
console.log('  points changed:', moodPtsBefore !== moodPtsAfter ? '✅' : '(already set today)');
await shot('mood-selected');

nextStep('🔍 Probe: Back button → navigates to /family-hub (FROM_HA path)');
const [navReq] = await Promise.all([
  page.waitForNavigation({ timeout: 5000 }).catch(() => null),
  page.click('.back-btn'),
]);
const finalUrl = page.url();
console.log('  final URL:', finalUrl);
console.log('  went to /family-hub:', finalUrl.includes('family-hub') ? '✅' : '❌ got: ' + finalUrl);
await shot('back-nav');

// ─────────────────────────────────────────────────────────
// DONE
// ─────────────────────────────────────────────────────────
await browser.close();
console.log('\n✅ Verification complete — screenshots in:', OUT);
console.log('Mood overflow found:', overflowFound ? '❌ YES' : '✅ NO');
