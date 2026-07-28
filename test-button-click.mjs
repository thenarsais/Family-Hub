import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  console.log('Logging in...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(5000);

const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (!frame) {
  console.log('❌ Frame not found');
  process.exit(1);
}

const btn = await frame.$('.open-btn');
if (!btn) {
  console.log('❌ Button not found');
  process.exit(1);
}

console.log('✅ Button found');

// Test that clicking the button calls window.open
const openCalled = await frame.evaluate(() => {
  let called = false;
  const origOpen = window.open;
  window.open = function(...args) {
    console.log('window.open called with:', args);
    called = true;
    return null; // Return null since we can't actually open a window in headless
  };

  document.querySelector('.open-btn').click();

  window.open = origOpen;
  return called;
});

if (openCalled) {
  console.log('✅ Button click triggered window.open()');
} else {
  console.log('❌ Button click did not call window.open()');
}

await browser.close();
