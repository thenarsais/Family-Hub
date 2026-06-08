import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  try {
    await page.waitForURL('**/family-hub**', { timeout: 20000 });
  } catch (e) {
    console.log('Login timeout, continuing anyway');
  }
}

await page.waitForTimeout(5000);

// Find the native HA button (not in iframe)
const buttons = await page.locator('text="Open Krish\'s Activity Board"').all();
console.log('Found', buttons.length, 'buttons with that text');

if (buttons.length > 0) {
  const nativeBtn = buttons[buttons.length - 1]; // Get the last one (should be the native button)
  console.log('✅ Found button, clicking...');
  
  let navigated = false;
  page.once('framenavigated', () => {
    navigated = true;
  });

  await nativeBtn.click();
  await page.waitForTimeout(2000);

  if (page.url().includes('krish-daily-tasks.html')) {
    console.log('✅ SUCCESS! Button navigated to Activity Board');
  } else {
    console.log('Current URL:', page.url());
  }
} else {
  console.log('❌ No button found');
}

await browser.close();
