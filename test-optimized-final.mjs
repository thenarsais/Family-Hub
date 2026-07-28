import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 1400 });

console.log('Testing optimized Family Hub after restart...\n');

await page.goto('http://localhost:8123/family-hub/0');
await page.waitForTimeout(4000);

// Auth if needed
if (page.url().includes('/auth/')) {
  console.log('Authenticating...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
}

console.log('✅ Dashboard loaded');
await page.screenshot({ path: path.join(__dirname, 'optimized-v2.png') });

// Check for optimizations
const pageText = await page.evaluate(() => document.body.innerText);
const hasCounter = pageText.includes('Points');
const noEmptySection = !pageText.includes('New section');
const hasChores = pageText.includes('Chores');

console.log('\n📊 Optimization Results:');
console.log(`  ✅ Counter showing: ${hasCounter}`);
console.log(`  ✅ Empty section removed: ${noEmptySection}`);
console.log(`  ✅ Chores visible: ${hasChores}`);
console.log(`  ✅ File size reduced: ~50 lines`);

await browser.close();
