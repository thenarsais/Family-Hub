import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 1400 });

console.log('Testing optimized Family Hub...\n');

await page.goto('http://localhost:8123/family-hub/0');
await page.waitForTimeout(5000);

console.log('✅ Dashboard loaded');
await page.screenshot({ path: path.join(__dirname, 'optimized-dashboard.png') });
console.log('✅ Screenshot saved');

// Check elements
const hasCounter = await page.evaluate(() => {
  const text = document.body.innerText;
  return text.includes('Points') && text.includes('🎯');
});

const hasEmptySection = await page.evaluate(() => {
  const text = document.body.innerText;
  return text.includes('New section');
});

const cardCount = await page.evaluate(() => {
  return document.querySelectorAll('[class*="card"]').length;
});

console.log('\nValidation:');
console.log(`  Counter displayed: ${hasCounter ? '✅' : '❌'}`);
console.log(`  Empty section removed: ${!hasEmptySection ? '✅' : '❌'}`);
console.log(`  Cards loaded: ${cardCount}`);

console.log('\n✅ Test complete');
await browser.close();
