import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

let popupUrl = null;
page.once('popup', async (popup) => {
  popupUrl = popup.url();
  console.log('✅ POPUP OPENED:', popupUrl);
  await popup.close();
});

await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(5000);

const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
const btn = await frame.$('.open-btn');

console.log('📍 Clicking button...');
await btn.click();
await page.waitForTimeout(1000);

if (popupUrl) {
  console.log('✅ BUTTON WORKS - Popup opened to:', popupUrl);
  if (popupUrl.includes('krish-daily-tasks.html')) {
    console.log('✅ Popup URL is correct');
  }
} else {
  console.log('⚠️ No popup detected (may be blocked by browser)');
}

await browser.close();
