import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

let popupOpened = false;
let popupUrl = null;

page.on('popup', popup => {
  popupOpened = true;
  popupUrl = popup.url();
  console.log('✅ Popup opened:', popupUrl);
  popup.close();
});

console.log('🔵 Opening dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  console.log('🔵 Logging in...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(5000);

console.log('🔵 Refreshing dashboard (Ctrl+R)...');
await page.keyboard.press('F5');
await page.waitForTimeout(3000);

const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (!frame) {
  console.log('❌ Summary card frame not found after refresh');
  await browser.close();
  process.exit(1);
}

console.log('✅ Summary card frame found');

const btn = await frame.$('.open-btn');
if (!btn) {
  console.log('❌ Button not found');
  await browser.close();
  process.exit(1);
}

const btnInfo = await frame.evaluate(() => {
  const btn = document.querySelector('.open-btn');
  return { tag: btn?.tagName, onclick: btn?.getAttribute('onclick') };
});

console.log('✅ Button found:', btnInfo);

console.log('🔵 Clicking button...');
await btn.click();
await page.waitForTimeout(2000);

if (popupOpened) {
  console.log('✅ SUCCESS - Button works! Popup opened after refresh.');
} else {
  console.log('❌ FAILED - Popup did not open after refresh');
}

await browser.close();
