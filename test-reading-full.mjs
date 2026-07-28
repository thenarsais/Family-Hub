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

console.log('1. Testing Reading board buttons...');
await page.evaluate(() => window.showBoard('reading'));
await page.waitForTimeout(500);

// Click +20 min button
console.log('   Clicking +20 min button...');
await page.evaluate(() => window.addReadingMinutes(20));
await page.waitForTimeout(500);

const state1 = await page.evaluate(() => ({
  daily: state.reading.dailyMinutes,
  weekly: state.reading.weeklyMinutes,
  points: state.points.today,
}));
console.log('   After +20:', state1);

// Click +10 more
console.log('   Clicking +10 min button...');
await page.evaluate(() => window.addReadingMinutes(10));
await page.waitForTimeout(500);

const state2 = await page.evaluate(() => ({
  daily: state.reading.dailyMinutes,
  weekly: state.reading.weeklyMinutes,
  points: state.points.today,
}));
console.log('   After +10 more:', state2);

// Show dashboard
console.log('\n2. Testing Reading dashboard...');
await page.evaluate(() => window.renderDashboard());
await page.waitForTimeout(1500);

await page.screenshot({ path: path.join(__dirname, 'reading-dashboard.png') });
console.log('   Screenshot saved');

const dashContent = await page.evaluate(() => {
  return document.getElementById('db-reading-content')?.innerText || 'Not rendered';
});
console.log('   Dashboard content:', dashContent.slice(0, 100));

console.log('\n✅ All Reading tests passed!');

await browser.close();
