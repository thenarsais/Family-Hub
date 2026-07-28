import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading fresh page...');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);

// Clear localStorage to start fresh
await page.evaluate(() => localStorage.clear());

// Reload
console.log('Reloading after clearing localStorage...');
await page.reload();
await page.waitForTimeout(5000);

// Now check state
const stateCheck = await page.evaluate(() => {
  return {
    stateExists: typeof state !== 'undefined',
    triviaExists: typeof state?.trivia !== 'undefined',
    questionExists: !!state?.trivia?.currentQuestion,
    questionText: state?.trivia?.currentQuestion?.q?.slice(0, 60),
  };
});

console.log('State check:', stateCheck);

// Show board
await page.evaluate(() => window.showBoard('trivia'));
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(__dirname, 'trivia-fresh.png') });
console.log('✅ Screenshot saved');

await browser.close();
