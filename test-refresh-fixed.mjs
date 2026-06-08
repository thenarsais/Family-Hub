import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

let popupUrl = null;
page.on('popup', popup => {
  popupUrl = popup.url();
  console.log('✅ POPUP OPENED:', popupUrl);
  popup.close();
});

console.log('🔵 Loading dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(5000);
console.log('✅ Dashboard loaded');

console.log('🔵 Refreshing page (F5)...');
await page.keyboard.press('F5');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3000);

console.log('🔵 Finding button and clicking...');
// After refresh, need to find the frame again
const frame = await page.waitForFunction(() => {
  return page.frames().find(f => f.url().includes('krish-summary-card'));
}, { timeout: 10000 });

if (!frame) {
  console.log('❌ Frame not found');
  process.exit(1);
}

// Click button directly via frame
await frame.click('.open-btn');
console.log('🔵 Button clicked, waiting for popup...');
await page.waitForTimeout(2000);

if (popupUrl) {
  console.log('\n✅ SUCCESS! Button works after refresh!');
  console.log('   Popup URL:', popupUrl);
} else {
  console.log('❌ No popup appeared');
}

await browser.close();
