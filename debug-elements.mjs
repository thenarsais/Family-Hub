import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

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
await page.evaluate(() => window.scrollBy(0, 800));
await page.waitForTimeout(1000);

// Get detailed info about elements
const elementInfo = await page.evaluate(() => {
  const elements = [];
  document.querySelectorAll('*').forEach((el, idx) => {
    const text = el.textContent;
    if (text && text.includes('Open Krish') && text.includes('Activity Board') && el.offsetParent !== null) {
      elements.push({
        idx: idx,
        tag: el.tagName,
        class: el.className,
        text: text.slice(0, 50),
        clickable: el.onclick ? 'yes' : 'no',
        visible: el.offsetParent !== null,
        tagName: el.tagName
      });
    }
  });
  return elements;
});

console.log('Elements with Activity Board text:');
elementInfo.forEach(el => {
  console.log(`  ${el.idx}: <${el.tag}> class="${el.class.slice(0, 40)}" clickable=${el.clickable}`);
});

// Try to find the actual button in HA's structure
const haElements = await page.evaluate(() => {
  const elements = [];
  
  // Look for hui-button-card
  document.querySelectorAll('hui-button-card').forEach(card => {
    elements.push({
      type: 'hui-button-card',
      found: true,
      hasShadow: !!card.shadowRoot
    });
  });
  
  // Look for any element with a tap_action-like structure
  document.querySelectorAll('[class*="button"], [class*="tap"]').forEach(el => {
    if (el.textContent.includes('Activity Board')) {
      elements.push({
        type: 'button-like',
        tag: el.tagName,
        class: el.className.slice(0, 50)
      });
    }
  });
  
  return elements;
});

console.log('\nHA-specific elements:');
haElements.slice(0, 10).forEach(el => {
  console.log(' ', el);
});

await browser.close();
