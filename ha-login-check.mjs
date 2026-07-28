import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages().find(p => p.url().includes('localhost:8123')) ?? await browser.contexts()[0].newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(__dirname, 'login-page.png') });
// Print all button-like elements
const btns = await page.$$eval('button, mwc-button, [role=button]', els =>
  els.map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0,40), label: el.getAttribute('label') }))
);
console.log('Buttons found:', JSON.stringify(btns, null, 2));
await browser.close();
