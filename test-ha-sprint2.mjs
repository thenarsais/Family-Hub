import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('=== HA Dashboard Test ===\n');

console.log('1. Loading HA dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

// Check if auth is needed
if (page.url().includes('/auth/')) {
  console.log('   Authenticating...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
  console.log('   ✅ Logged in');
}

await page.waitForTimeout(4000);

// Get the krish summary card iframe
const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (frame) {
  console.log('2. ✅ Found Krish Summary Card iframe');
  
  // Get summary data
  const summary = await frame.evaluate(() => {
    const header = document.querySelector('.summary-header')?.textContent || 'N/A';
    const stats = document.querySelector('.summary-stats')?.textContent || 'N/A';
    return { header: header.slice(0, 50), stats: stats.slice(0, 100) };
  });
  console.log('   Summary:', summary.header);
} else {
  console.log('2. ⚠️ Summary card iframe not found');
}

console.log('\n3. Taking HA dashboard screenshot...');
await page.screenshot({ path: path.join(__dirname, 'ha-dashboard.png') });
console.log('   ✅ Screenshot saved');

console.log('\n4. Accessing Activity Board from HA...');
// Look for the Activity Board button in HA
const boardBtn = await page.locator('button:has-text("Activity Board")').first().catch(() => null);
if (boardBtn) {
  await boardBtn.click();
  await page.waitForTimeout(3000);
  console.log('   ✅ Clicked Activity Board button');
} else {
  // Try to navigate directly to the Activity Board iframe
  console.log('   Attempting direct navigation...');
  const iframes = page.frames();
  const activityFrame = iframes.find(f => f.url().includes('krish-daily-tasks'));
  if (activityFrame) {
    console.log('   ✅ Found Activity Board iframe');
  }
}

await page.screenshot({ path: path.join(__dirname, 'ha-board-start.png') });
console.log('   ✅ Screenshot taken');

console.log('\n✅ HA dashboard tests complete');
await browser.close();
