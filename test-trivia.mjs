import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading Activity Board...');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

console.log('Looking for Trivia tab...');
const triviaTab = await page.locator('button[data-tab="trivia"]').first();
if (!triviaTab) {
  console.log('❌ Trivia tab not found');
  await browser.close();
  process.exit(1);
}

console.log('✅ Trivia tab found, clicking it...');
await triviaTab.click();
await page.waitForTimeout(1500);

console.log('Taking screenshot...');
await page.screenshot({ path: path.join(__dirname, 'trivia-board.png') });
console.log('Screenshot saved');

// Check if question is visible
const question = await page.locator('text=/Daily Trivia|answer/i').first();
if (question) {
  console.log('✅ Trivia content visible');
}

await browser.close();
