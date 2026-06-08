import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading Activity Board...');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(4000);

console.log('Page loaded');
await page.screenshot({ path: path.join(__dirname, 'activity-board-load.png') });
console.log('Screenshot saved');

// Check page content
const title = await page.locator('text=Activity Board').first();
const exists = await title.isVisible().catch(() => false);
console.log('Activity Board title visible:', exists);

const tabs = await page.locator('button[class*="b-tab"]').count();
console.log('Number of tabs found:', tabs);

await browser.close();
