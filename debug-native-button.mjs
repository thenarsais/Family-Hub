import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('Loading...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  try {
    await page.waitForURL('**/family-hub**', { timeout: 20000 });
  } catch (e) {}
}

await page.waitForTimeout(5000);

// Find the button in the page (not in iframe)
const btnLocator = page.locator('text="Open Krish\'s Activity Board"');
const count = await btnLocator.count();
console.log('Buttons found:', count);

for (let i = 0; i < count; i++) {
  const btn = btnLocator.nth(i);
  const tag = await btn.evaluate(el => el.tagName);
  const onclick = await btn.evaluate(el => el.getAttribute('onclick')).catch(() => 'none');
  const href = await btn.evaluate(el => el.getAttribute('href')).catch(() => 'none');
  
  console.log(`Button ${i}: tag=${tag}, onclick=${onclick}, href=${href}`);
  
  // Try to find parent card
  const parent = await btn.evaluate(el => {
    let p = el;
    for (let i = 0; i < 10; i++) {
      p = p.parentElement;
      if (!p) break;
      if (p.tagName.includes('CARD') || p.classList.toString().includes('card')) {
        return p.tagName + '.' + p.className;
      }
    }
    return 'not found';
  });
  
  console.log(`  Parent card info: ${parent}`);
}

await browser.close();
