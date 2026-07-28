import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newView();

console.log('Checking if template sensors loaded...\n');

await page.goto('http://localhost:8123/');
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  console.log('Authenticating...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
}

await page.goto('http://localhost:8123/config/entities/');
await page.waitForTimeout(2000);

// Search for HVAC filter sensor
await page.fill('input[type="search"]', 'hvac_filter_status');
await page.waitForTimeout(1000);

const result = await page.evaluate(() => {
  const entities = Array.from(document.querySelectorAll('[class*="entity"]'));
  return {
    found: entities.length > 0,
    text: document.body.innerText.substring(0, 500)
  };
});

console.log('Template Sensors Status:');
if (result.found) {
  console.log('✅ sensor.hvac_filter_status FOUND\n');
} else {
  console.log('⏳ Checking alternate method...\n');
}

await browser.close();
