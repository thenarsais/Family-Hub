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

console.log('Showing Trivia board...');
await page.evaluate(() => window.showBoard('trivia'));
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(__dirname, 'trivia-board-final.png') });
console.log('✅ Screenshot saved');

const panelText = await page.evaluate(() => {
  const panel = document.getElementById('panel-trivia');
  return panel ? panel.innerText : 'Panel not found';
});

console.log('\n=== Board content ===');
console.log(panelText.slice(0, 300));

await browser.close();
