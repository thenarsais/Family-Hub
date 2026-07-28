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

console.log('🔵 Refreshing page...');
await page.keyboard.press('F5');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(4000);

console.log('🔵 Finding button in iframe...');
for (let attempt = 0; attempt < 5; attempt++) {
  const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
  if (frame) {
    const btn = await frame.$('.open-btn');
    if (btn) {
      console.log('✅ Button found, clicking...');
      await frame.click('.open-btn');
      await page.waitForTimeout(2000);
      
      if (popupUrl) {
        console.log('\n✅ SUCCESS! Button works!');
        console.log('   Popup URL:', popupUrl);
      } else {
        console.log('❌ Button clicked but no popup appeared');
      }
      await browser.close();
      process.exit(0);
    }
  }
  await page.waitForTimeout(500);
}

console.log('❌ Button not found after 5 attempts');
await browser.close();
process.exit(1);
