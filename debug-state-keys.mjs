import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(3000);

const stateKeys = await page.evaluate(() => {
  if (!window.state) return 'NO STATE';
  return Object.keys(window.state);
});

console.log('State keys:', stateKeys);

// Check localStorage
const lsData = await page.evaluate(() => {
  const raw = localStorage.getItem('krish_tasks_v1');
  if (!raw) return 'NO LS DATA';
  try {
    const data = JSON.parse(raw);
    return Object.keys(data);
  } catch (e) {
    return 'PARSE ERROR: ' + e.message;
  }
});

console.log('LocalStorage keys:', lsData);

await browser.close();
