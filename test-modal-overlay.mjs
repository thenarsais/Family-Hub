/**
 * Test the modal overlay implementation:
 * 1. Dashboard loads
 * 2. Button is visible in Krish's Day card
 * 3. Clicking button opens modal
 * 4. Activity Board renders in modal
 * 5. Close button dismisses modal
 * 6. Escape key dismisses modal
 * 7. Card headers work from modal
 */
import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'test-modal-screenshots');
import fs from 'fs';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
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
    await shot('ERR-' + label.replace(/\W+/g,'_').slice(0,35));
  }
}

// Setup: navigate to HA
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

// Login if needed
if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(5000);

// ── 1: Dashboard loads ────────────────────────────
await check('HA family-hub dashboard loads', async () => {
  await page.waitForSelector('home-assistant', { timeout: 8000 });
});
await shot('01-dashboard-loaded');

// ── 2: Krish's Day card visible ──────────────────
await check('Krish\'s Day card is visible', async () => {
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  if (!frame) throw new Error('Summary card frame not found');
  // Check that the card contains the heading
  const name = await frame.$eval('.hdr-name', el => el.textContent).catch(() => null);
  console.log('   Card name:', name);
  if (!name?.includes('Krish')) throw new Error('Card heading missing');
});
await shot('02-krish-card-visible');

// ── 3: Button is visible in the card ─────────────
await check('Open button is visible in card', async () => {
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  const btn = await frame.$('.open-btn');
  if (!btn) throw new Error('Button not found in summary card');
  const text = await btn.textContent();
  console.log('   Button text:', text.trim());
  if (!text.includes('Activity Board')) throw new Error('Wrong button text: ' + text);
});
await shot('03-button-visible');

// ── 4: Clicking button opens modal ───────────────
await check('Clicking button opens modal overlay', async () => {
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  const btn = await frame.$('.open-btn');
  await btn.evaluate(el => el.click()); // click within the frame context
  await page.waitForTimeout(500);
  // Check if modal is visible (it's in the main page, not iframe)
  const modal = await page.$('.modal.active');
  if (!modal) throw new Error('Modal not opened after button click');
  console.log('   Modal overlay opened ✅');
});
await shot('04-modal-opened');

// ── 5: Activity Board loads in modal ─────────────
await check('Activity Board renders inside modal', async () => {
  const iframes = page.frames().filter(f => f.url().includes('krish-daily-tasks'));
  if (iframes.length === 0) throw new Error('Activity Board iframe not found in modal');
  const boardFrame = iframes[0];
  await boardFrame.waitForSelector('#view-dashboard.active', { timeout: 5000 });
  const greeting = await boardFrame.$eval('#greeting-text', el => el.textContent).catch(() => null);
  console.log('   Greeting:', greeting?.trim());
});
await shot('05-board-in-modal');

// ── 6: Can interact with Activity Board from modal ─
await check('Activity Board tabs work from modal', async () => {
  const iframes = page.frames().filter(f => f.url().includes('krish-daily-tasks'));
  const boardFrame = iframes[0];
  // Click a card header to open the board
  await boardFrame.click('#db-chores-card .db-card-hdr');
  await boardFrame.waitForSelector('#view-board.active', { timeout: 4000 });
  const tab = await boardFrame.$eval('.b-tab.active', el => el.dataset.tab);
  console.log('   Switched to tab:', tab);
  if (tab !== 'chores') throw new Error('Wrong tab: ' + tab);
});
await shot('06-board-interactive');

// ── 7: Close button dismisses modal ──────────────
await check('Close button (✕) dismisses modal', async () => {
  const closeBtn = await page.$('.modal-close');
  if (!closeBtn) throw new Error('Close button not found');
  await closeBtn.click();
  await page.waitForTimeout(400);
  const modal = await page.$('.modal.active');
  if (modal) throw new Error('Modal still visible after close');
  console.log('   Modal dismissed ✅');
});
await shot('07-modal-closed');

// ── 8: Dashboard still visible after close ───────
await check('Dashboard is visible after modal closes', async () => {
  await page.waitForSelector('home-assistant', { timeout: 5000 });
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  if (!frame) throw new Error('Summary card gone after modal close');
  console.log('   Dashboard intact ✅');
});
await shot('08-dashboard-after-close');

// ── 9: Escape key closes modal ───────────────────
await check('Escape key dismisses modal', async () => {
  // Reopen modal
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  const btn = await frame.$('.open-btn');
  await btn.evaluate(el => el.click());
  await page.waitForTimeout(400);
  let modal = await page.$('.modal.active');
  if (!modal) throw new Error('Modal not reopened');
  // Press Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  modal = await page.$('.modal.active');
  if (modal) throw new Error('Modal still open after Escape');
  console.log('   Escape key works ✅');
});
await shot('09-escape-closes');

// ── 10: Modal/board interaction cycle ────────────
await check('Full interaction cycle works', async () => {
  // Open again
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  const btn = await frame.$('.open-btn');
  await btn.evaluate(el => el.click());
  await page.waitForTimeout(500);

  // Verify Activity Board is there
  const iframes = page.frames().filter(f => f.url().includes('krish-daily-tasks'));
  if (iframes.length === 0) throw new Error('Activity Board missing after reopen');

  // Close via close button
  const closeBtn = await page.$('.modal-close');
  await closeBtn.click();
  await page.waitForTimeout(400);

  // Check dashboard
  const dashFrame = page.frames().find(f => f.url().includes('krish-summary-card'));
  if (!dashFrame) throw new Error('Dashboard not recovered after close');
  console.log('   Full cycle works ✅');
});
await shot('10-full-cycle');

// Report
await browser.close();

console.log('\n════════════════════════════════');
if (issues.length === 0) {
  console.log('All modal tests passed ✅');
} else {
  console.log(`${issues.length} issue(s):`);
  issues.forEach(i => console.log(' •', i));
}
console.log('Screenshots →', OUT);
