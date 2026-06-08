import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000); // Wait longer for init

console.log('Switching to Trivia board...');
await page.evaluate(() => window.showBoard('trivia'));
await page.waitForTimeout(1500);

console.log('Taking screenshot...');
await page.screenshot({ path: path.join(__dirname, 'trivia-final.png') });

const panelText = await page.evaluate(() => {
  return document.getElementById('panel-trivia')?.innerText?.slice(0, 200) || 'Panel not found';
});

console.log('Panel content:', panelText);

await browser.close();
