import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(3000);

// Click on a card header to switch to board view first
console.log('Clicking Chores to enter board view...');
await page.click('text=Chores').catch(() => {});
await page.waitForTimeout(1500);

// Now click on Trivia tab
console.log('Clicking Trivia tab...');
await page.evaluate(() => {
  const btn = document.querySelector('button[data-tab="trivia"]');
  if (btn) {
    btn.scrollIntoView();
    btn.click();
  }
});
await page.waitForTimeout(1500);

console.log('Taking screenshot...');
await page.screenshot({ path: path.join(__dirname, 'trivia-working.png') });
console.log('✅ Screenshot saved');

await browser.close();
