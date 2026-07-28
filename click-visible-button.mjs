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

// Scroll down to make the button visible
await page.evaluate(() => window.scrollBy(0, 800));
await page.waitForTimeout(1000);

// Get all clickable elements and find the ones with Activity Board text
const clickables = await page.evaluate(() => {
  const elements = [];
  document.querySelectorAll('*').forEach(el => {
    const text = el.textContent;
    const isClickable = el.onclick || (el.tagName === 'BUTTON') || (el.tagName === 'A');
    
    if (text && text.includes('Open Krish') && text.includes('Activity Board') && el.offsetParent !== null) {
      elements.push({
        tag: el.tagName,
        text: text.slice(0, 50),
        clickable: isClickable,
        visible: el.offsetParent !== null,
        rect: el.getBoundingClientRect()
      });
    }
  });
  return elements;
});

console.log('Clickable Activity Board elements:', clickables.length);
clickables.forEach((el, i) => {
  console.log(`${i}: ${el.tag} - ${el.text} - visible: ${el.visible}, clickable: ${el.clickable}`);
});

// Try to click the second one (should be the native button, not the iframe button)
if (clickables.length > 1) {
  const rect = clickables[1].rect;
  console.log('Clicking element at', rect.x, rect.y);
  
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.click();
  
  await page.waitForTimeout(2000);
  console.log('After click, URL is:', page.url());
} else {
  console.log('Could not find native button to click');
}

await browser.close();
