import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading dashboard...');
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

console.log('Refreshing...');
await page.keyboard.press('F5');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(4000);

console.log('Finding button...');
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

console.log('✅ Button found, clicking...');

// Listen for navigation
let navigated = false;
const navigationPromise = page.waitForNavigation().then(() => {
  navigated = true;
}).catch(() => {}); // Ignore if no navigation

await frame.click('.open-btn');
await Promise.race([navigationPromise, page.waitForTimeout(3000)]);

// Check if we navigated to the Activity Board
if (page.url().includes('krish-daily-tasks.html')) {
  console.log('✅ SUCCESS! Button navigated to Activity Board');
  console.log('   URL:', page.url());
} else {
  console.log('❌ No navigation occurred');
  console.log('   Current URL:', page.url());
}

await browser.close();
