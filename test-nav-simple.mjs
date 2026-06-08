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
  try {
    await page.waitForURL('**/family-hub**', { timeout: 20000 });
  } catch (e) {
    console.log('Login timeout, trying anyway...');
  }
}

await page.waitForTimeout(5000);

const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (!frame) {
  console.log('❌ Frame not found');
  await browser.close();
  process.exit(1);
}

console.log('Clicking button...');
await frame.click('.open-btn');

// Wait a bit for navigation
await page.waitForTimeout(2000);

console.log('Current URL:', page.url());

if (page.url().includes('krish-daily-tasks.html')) {
  console.log('✅ Button successfully navigated to Activity Board!');
} else {
  console.log('❌ Button did not navigate');
}

await browser.close();
