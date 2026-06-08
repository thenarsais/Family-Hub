import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('🔵 Loading dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  console.log('🔵 Logging in...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  try {
    await page.waitForURL('**/family-hub**', { timeout: 20000 });
  } catch (e) {
    console.log('⚠️ Login timeout, continuing...');
  }
}

await page.waitForTimeout(5000);
console.log('✅ Dashboard loaded');

// Scroll to the button
console.log('🔵 Scrolling to button...');
await page.evaluate(() => window.scrollBy(0, 800));
await page.waitForTimeout(1000);

// Get all divs with text containing checkmark and Activity Board
const buttons = await page.locator('div, button, a').filter({ hasText: /Open Krish.*Activity Board/ }).all();
console.log(`Found ${buttons.length} elements with Activity Board text`);

if (buttons.length === 0) {
  console.log('❌ No button found');
  await browser.close();
  process.exit(1);
}

// Try clicking each one until we find the native button (not in iframe)
for (let i = 0; i < buttons.length; i++) {
  const btn = buttons[i];
  const text = await btn.textContent();
  const visible = await btn.isVisible();
  
  if (visible && text.includes('Activity Board')) {
    console.log(`🔵 Clicking button ${i}: "${text.slice(0, 40)}..."`);
    
    // Monitor navigation
    let navigated = false;
    page.once('framenavigated', () => {
      navigated = true;
    });
    
    try {
      await btn.click({ force: true });
      await page.waitForTimeout(3000);
      
      console.log('Current URL:', page.url());
      if (page.url().includes('krish-daily-tasks.html')) {
        console.log('✅ SUCCESS! Button worked - navigated to Activity Board');
        await browser.close();
        process.exit(0);
      }
    } catch (e) {
      console.log(`⚠️ Click failed: ${e.message.split('\n')[0]}`);
    }
  }
}

console.log('❌ Could not successfully click a button');
await browser.close();
process.exit(1);
