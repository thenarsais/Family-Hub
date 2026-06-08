import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(5000);

const frame = page.frames().find(f => f.url().includes('krish-summary-card'));

// Get button HTML and properties
const btnInfo = await frame.evaluate(() => {
  const btn = document.querySelector('.open-btn');
  return {
    exists: !!btn,
    html: btn?.outerHTML,
    onclick: btn?.onclick?.toString(),
    onclick_attr: btn?.getAttribute('onclick'),
    class: btn?.className,
    type: btn?.tagName
  };
});

console.log(JSON.stringify(btnInfo, null, 2));
await browser.close();
