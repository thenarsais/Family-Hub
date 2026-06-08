import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);

// Set some reading data
await page.evaluate(() => {
  state.reading.dailyMinutes = 15;
  state.reading.weeklyMinutes = 45;
  localStorage.setItem('krish_tasks_v1', JSON.stringify(state));
  window.renderDashboard();
});
await page.waitForTimeout(1500);

// Go back to dashboard view
await page.evaluate(() => {
  document.querySelector('button:has(span:contains("Dashboard"))').click();
});
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(__dirname, 'reading-on-dashboard.png') });
console.log('✅ Dashboard screenshot saved');

const readingCard = await page.evaluate(() => {
  return document.getElementById('db-reading-content')?.innerText?.slice(0, 150) || 'Not found';
});
console.log('Reading card content:', readingCard);

await browser.close();
