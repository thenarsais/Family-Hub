import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(5000);

console.log('Testing Reading dashboard...');
const dashText = await page.evaluate(() => {
  return document.getElementById('db-reading-summary')?.textContent || 'Not found';
});
console.log('Dashboard summary:', dashText);

console.log('\nShowing Reading board...');
await page.evaluate(() => window.showBoard('reading'));
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(__dirname, 'reading-board.png') });
console.log('✅ Screenshot saved');

const panelText = await page.evaluate(() => {
  return document.getElementById('panel-reading')?.innerText?.slice(0, 300) || 'Panel not found';
});
console.log('\n=== Board content ===');
console.log(panelText);

// Test adding reading time
console.log('\n=== Testing add +5 min ===');
await page.evaluate(() => window.addReadingMinutes(5));
await page.waitForTimeout(500);

const after = await page.evaluate(() => {
  return {
    dailyMinutes: state.reading.dailyMinutes,
    weeklyMinutes: state.reading.weeklyMinutes,
  };
});
console.log('After adding 5 min:', after);

await browser.close();
