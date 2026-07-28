import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(3000);

// Call showBoard('trivia') directly via evaluate
console.log('Switching to Trivia board view...');
await page.evaluate(() => {
  window.showBoard('trivia');
});
await page.waitForTimeout(1500);

console.log('Taking screenshot...');
await page.screenshot({ path: path.join(__dirname, 'trivia-board-view.png') });
console.log('✅ Trivia board screenshot saved');

// Get some info about what's on the page
const panelContent = await page.evaluate(() => {
  const panel = document.getElementById('panel-trivia');
  return panel ? panel.innerText.slice(0, 100) : 'Panel not found';
});
console.log('Panel content start:', panelContent);

await browser.close();
