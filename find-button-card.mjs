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

// Find all ha-card elements
const cardElements = await page.evaluate(() => {
  const cards = [];
  document.querySelectorAll('hui-button-card').forEach(card => {
    const btnText = card.innerText || card.textContent;
    const shadow = card.shadowRoot;
    const button = shadow ? shadow.querySelector('button') : null;
    
    cards.push({
      type: 'hui-button-card',
      text: btnText?.slice(0, 50),
      hasButton: !!button,
      hasClickHandler: button && button.onclick ? 'yes' : 'no'
    });
  });
  return cards;
});

console.log('hui-button-card elements found:', cardElements.length);
cardElements.forEach((card, i) => {
  console.log(`  ${i}:`, card);
});

// Alternative: find all buttons on the page
const allButtons = await page.evaluate(() => {
  const btns = [];
  document.querySelectorAll('button, a[role="button"]').forEach(btn => {
    if (btn.textContent.includes('Activity Board')) {
      btns.push({
        tag: btn.tagName,
        text: btn.textContent.slice(0, 40),
        parent: btn.parentElement?.tagName,
        visible: btn.offsetParent !== null
      });
    }
  });
  return btns;
});

console.log('Buttons with "Activity Board" text:', allButtons.length);
allButtons.forEach((btn, i) => {
  console.log(`  ${i}:`, btn);
});

await browser.close();
