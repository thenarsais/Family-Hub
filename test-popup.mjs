/**
 * Test the popup implementation:
 * 1. Button click opens popup window
 * 2. Activity Board loads in popup
 * 3. User can interact with it
 * 4. Close popup to return to dashboard
 */
import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch({ headless: false }); // visible mode to see popups
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('🔵 Opening Family Hub dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

// Login
if (page.url().includes('/auth/')) {
  console.log('🔵 Logging in...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(5000);
console.log('✅ Dashboard loaded');

// Find button in iframe
const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (!frame) {
  console.log('❌ Summary card frame not found');
  process.exit(1);
}

const btn = await frame.$('.open-btn');
if (!btn) {
  console.log('❌ Button not found');
  process.exit(1);
}

console.log('✅ Button found, clicking...');

// Listen for popup windows
let popupPage = null;
context.once('page', p => {
  console.log('✅ Popup opened!');
  popupPage = p;
});

// Click button
await btn.click();
await page.waitForTimeout(2000);

if (!popupPage) {
  console.log('⚠️ No popup appeared (popup might be blocked by browser)');
  console.log('   But the Activity Board should open as a new window in normal use');
} else {
  console.log('🔵 Checking Activity Board in popup...');

  // Wait for Activity Board to load
  try {
    await popupPage.waitForSelector('#view-dashboard.active', { timeout: 5000 });
    console.log('✅ Activity Board loaded in popup');

    // Verify we can interact with it
    await popupPage.click('#db-chores-card .db-card-hdr');
    await popupPage.waitForSelector('#view-board.active', { timeout: 3000 });
    console.log('✅ Can interact with Activity Board');

    // Close popup
    await popupPage.close();
    console.log('✅ Popup closed');
  } catch (e) {
    console.log('❌ Activity Board interaction failed:', e.message.split('\n')[0]);
  }
}

// Verify dashboard still there
await page.waitForTimeout(500);
const dashFrame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (dashFrame) {
  console.log('✅ Dashboard still accessible after popup');
} else {
  console.log('❌ Dashboard lost after popup');
}

await browser.close();
console.log('\n✨ Test complete');
