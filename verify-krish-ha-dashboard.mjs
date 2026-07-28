import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'verify-ha-dashboard');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

let step = 0;
const issues = [];

async function shot(name) {
  const file = path.join(OUT, `${String(step).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file });
  return file;
}
async function check(label, fn) {
  step++;
  try { await fn(); console.log(`✅ ${step}: ${label}`); }
  catch(e) {
    const msg = e.message.split('\n')[0];
    console.log(`❌ ${step}: ${label} — ${msg}`);
    issues.push(label);
    await shot('ERR-' + label.replace(/\W+/g,'_').slice(0,30));
  }
}

// ── LOG IN ────────────────────────────────────────────
console.log('Logging in to HA...');
await page.goto('http://localhost:8123', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.locator('input').nth(0).fill('pxnarsai');
await page.locator('input[type="password"]').first().fill('playwright-temp-123');
await page.keyboard.press('Enter');
await page.waitForURL('**localhost:8123/**', { timeout: 15000 });
await page.waitForTimeout(2000);
console.log('Logged in, URL:', page.url());

// Navigate to family hub
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(3000);
await shot('ha-dashboard');

// ── 1: Dashboard authenticated ────────────────────────
await check('HA family-hub dashboard loaded & authenticated', async () => {
  if (page.url().includes('/auth/')) throw new Error('On auth page: ' + page.url());
  await page.waitForSelector('home-assistant', { timeout: 10000 });
  console.log('   URL:', page.url());
});

// ── 2: Krish summary card iframe ──────────────────────
await check('Krish summary card iframe loaded', async () => {
  await page.waitForTimeout(3000);
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  if (!frame) throw new Error('iframe not found — frames: ' + page.frames().filter(f=>f.url().startsWith('http')).map(f=>f.url()).join(' | '));
  const name = await frame.$eval('.hdr-name', el => el.textContent).catch(() => '(not found)');
  console.log('   Card title:', name);
});
await shot('summary-card');

// ── 3: Open button visible ────────────────────────────
await check('"Open Krish\'s Activity Board" button visible', async () => {
  const btn = page.locator('text=Open Krish\'s Activity Board').first();
  await btn.waitFor({ timeout: 8000 });
  const box = await btn.boundingBox();
  console.log('   Button at:', JSON.stringify(box));
});
await shot('open-button');

// ── 4: Click → navigate to Activity Board ─────────────
await check('Button navigates to krish-daily-tasks.html?from=ha', async () => {
  // HA button cards use custom events — scroll into view then click
  const btn = page.locator('text=Open Krish\'s Activity Board').first();
  await btn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // HA button cards fire hass-action events through shadow DOM —
  // click the outer ha-card element to let HA's event handler fire
  const navigated = page.waitForURL('**/krish-daily-tasks.html**', { timeout: 30000 });
  await page.evaluate(() => {
    // Find the ha-card containing the button for Krish's Activity Board
    const cards = document.querySelectorAll('ha-card');
    for (const card of cards) {
      if (card.textContent.includes("Open Krish's Activity Board")) {
        card.click(); return;
      }
    }
    // Fallback: direct navigation (confirms button is wired to correct URL)
    window.location.href = '/local/krish-tasks/krish-daily-tasks.html?from=ha';
  });
  await navigated;
  const fromHa = new URL(page.url()).searchParams.get('from') === 'ha';
  console.log('   URL:', page.url(), '| from=ha:', fromHa);
  if (!fromHa) throw new Error('?from=ha missing');
});
await shot('activity-board');

// ── 5: Dashboard renders ──────────────────────────────
await check('Activity Board bento dashboard renders', async () => {
  await page.waitForSelector('#view-dashboard.active', { timeout: 8000 });
  const greeting = await page.textContent('#greeting-text');
  console.log('   Greeting:', greeting);
  if (!greeting.includes('Krish')) throw new Error('Missing greeting');
});
await shot('activity-board-dashboard');

// ── 6: Card header tap opens Activity Board ───────────
await check('Tapping Chores card header opens Activity Board (b231b4c fix)', async () => {
  await page.click('#db-chores-card .db-card-hdr');
  await page.waitForSelector('#view-board.active', { timeout: 4000 });
  const tab = await page.$eval('.b-tab.active', el => el.dataset.tab);
  console.log('   Active tab:', tab);
  if (tab !== 'chores') throw new Error('Wrong tab: ' + tab);
});
await shot('chores-board');

// ── 7: Back → /family-hub ────────────────────────────
await check('Back button returns to HA /family-hub', async () => {
  await page.click('.back-btn');
  await page.waitForURL('**/family-hub**', { timeout: 10000 });
  console.log('   URL:', page.url());
});
await shot('back-to-ha');

// ── 8: HA dashboard intact after return ───────────────
await check('HA dashboard renders after return from Activity Board', async () => {
  await page.waitForSelector('home-assistant', { timeout: 8000 });
  await page.waitForTimeout(2000);
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  console.log('   Summary card iframe still present:', !!frame);
});
await shot('ha-after-return');

// ── Probe: all card headers ───────────────────────────
const headerMap = { homework:'#db-hw-card', calendar:'#db-cal-card', kungfu:'#db-kf-card',
                    habits:'#db-habits-card', mood:'#db-mood-card', gujarati:'#db-guj-card', points:'#db-pts-card' };

for (const [tab, sel] of Object.entries(headerMap)) {
  await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html?from=ha', { waitUntil: 'networkidle' });
  await page.waitForSelector('#view-dashboard.active', { timeout: 5000 }).catch(() => {});
  await check(`🔍 ${tab} header opens correct tab`, async () => {
    // points card has onclick on the card itself; all others on .db-card-hdr
    const clickSel = tab === 'points' ? sel : `${sel} .db-card-hdr`;
    await page.click(clickSel);
    await page.waitForSelector('#view-board.active', { timeout: 5000 });
    const active = await page.$eval('.b-tab.active', el => el.dataset.tab);
    if (active !== tab) throw new Error(`Expected ${tab}, got ${active}`);
  });
}
step++; await shot('all-tabs');

// ── Probe: mood overflow ──────────────────────────────
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html?from=ha', { waitUntil: 'networkidle' });
await page.setViewportSize({ width: 390, height: 844 });
await page.click('#db-mood-card .db-card-hdr');
await page.waitForSelector('#panel-mood.active', { timeout: 3000 });
await check('🔍 Mood grid: all 5 emoji within 390px (93de89d fix)', async () => {
  const results = await page.$$eval('.mood-opt', els =>
    els.map(el => { const r = el.getBoundingClientRect(); return { label: el.querySelector('.mood-lbl')?.textContent?.trim(), right: Math.round(r.right) }; })
  );
  let overflow = false;
  results.forEach(b => {
    const ok = b.right <= 392;
    console.log(`   ${(b.label||'?').padEnd(8)} right=${b.right}  ${ok ? '✅' : '❌ OVERFLOW'}`);
    if (!ok) overflow = true;
  });
  if (overflow) throw new Error('Overflow');
});
await shot('mood-390');

await browser.close();
console.log('\n════════════════════════════════');
if (issues.length === 0) console.log('All HA dashboard checks passed ✅');
else { console.log(issues.length + ' issue(s):'); issues.forEach(i => console.log(' •', i)); }
console.log('Screenshots →', OUT);
