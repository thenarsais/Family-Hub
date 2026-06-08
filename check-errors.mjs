import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
page.on('console', msg => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);

console.log('Errors found:', errors);

// Check if init function exists
const initExists = await page.evaluate(() => typeof window.init === 'function');
console.log('init() function exists:', initExists);

// Try calling init manually
const result = await page.evaluate(() => {
  try {
    window.init();
    return 'init() called successfully';
  } catch (e) {
    return 'init() error: ' + e.message;
  }
});

console.log('Manual init result:', result);

// Check state now
const hasState = await page.evaluate(() => !!window.state);
console.log('window.state exists after manual init:', hasState);

await browser.close();
