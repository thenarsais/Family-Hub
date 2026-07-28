import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0] ?? await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:8123', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(__dirname, 'login-debug-before.png') });

// Fill form
const user = await page.locator('input').nth(0);
const pass = await page.locator('input[type="password"]').first();
await user.fill('pxnarsai');
await pass.fill(process.env.HA_PASS);
await page.screenshot({ path: path.join(__dirname, 'login-debug-filled.png') });

// Submit
await page.keyboard.press('Enter');
await page.waitForTimeout(4000);
await page.screenshot({ path: path.join(__dirname, 'login-debug-after.png') });
console.log('URL after submit:', page.url());
await browser.close();
