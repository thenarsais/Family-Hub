import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
if (page.url().includes('/auth/')) {
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}
await page.waitForTimeout(6000);

const info = await page.evaluate(() => {
  const stacks = [];
  const walk = (root) => {
    if (!root) return;
    root.querySelectorAll('hui-vertical-stack-card').forEach(el => stacks.push(el));
    root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) walk(el.shadowRoot); });
  };
  walk(document);

  return stacks.slice(0, 2).map(stack => {
    const sr = stack.shadowRoot;
    if (!sr) return { error: 'no shadow root' };
    // Get all elements in shadow root with their tag, class, and computed gap
    const els = [...sr.querySelectorAll('*')].map(el => ({
      tag: el.tagName.toLowerCase(),
      id: el.id,
      class: el.className,
      gap: window.getComputedStyle(el).gap,
      rowGap: window.getComputedStyle(el).rowGap,
      display: window.getComputedStyle(el).display,
    })).filter(e => e.gap !== 'normal' || e.display === 'flex');
    return { shadowElements: els };
  });
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
