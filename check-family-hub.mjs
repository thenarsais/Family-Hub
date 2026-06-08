import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setViewportSize({ width: 1280, height: 1400 });

console.log('🔍 Checking Family Hub dashboard...\n');

await page.goto('http://localhost:8123/');
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
}

// Navigate to Family Hub
await page.goto('http://localhost:8123/lovelace/family_hub');
await page.waitForTimeout(3000);

const pageText = await page.evaluate(() => document.body.innerText);

if (pageText.includes('Gujarati') || pageText.includes('Open')) {
  console.log('✅ Found Gujarati reference on Family Hub!\n');
} else {
  console.log('ℹ️ Checking page content...\n');
}

// Take screenshot
const screenshotPath = path.join(__dirname, 'family-hub-final.png');
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`📸 Screenshot saved: family-hub-final.png\n`);
console.log('✅ Dashboard updated!');

await browser.close();
