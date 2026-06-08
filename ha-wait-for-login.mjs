import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];
await page.setViewportSize({ width: 1280, height: 900 });

// Navigate to family hub — if already logged in, stays; if not, auth page
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });

console.log('Waiting for login... (up to 2 min)');
await page.waitForURL('**/family-hub**', { timeout: 120000 });
console.log('Logged in! URL:', page.url());

await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(__dirname, 'ha-logged-in.png') });
console.log('Screenshot saved: ha-logged-in.png');
await browser.close();
