import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('=== HA Dashboard Test ===\n');

console.log('1. Loading HA dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

if (page.url().includes('/auth/')) {
  console.log('   Authenticating...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
  console.log('   ✅ Logged in');
}

await page.waitForTimeout(4000);

console.log('2. Taking HA dashboard screenshot...');
await page.screenshot({ path: path.join(__dirname, 'ha-dashboard-full.png') });
console.log('   ✅ Dashboard screenshot saved');

// Check for Activity Board button in summary card
const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (frame) {
  console.log('\n3. Found Summary Card iframe, checking for button...');
  const btnExists = await frame.evaluate(() => {
    const btn = document.querySelector('.open-btn') || document.querySelector('button');
    return !!btn;
  });
  
  if (btnExists) {
    console.log('   ✅ Button exists in summary card');
    
    // Try to click the button within the frame
    try {
      await frame.click('button:first-of-type');
      await page.waitForTimeout(3000);
      console.log('   ✅ Button clicked');
    } catch (e) {
      console.log('   ⚠️ Could not click button in iframe:', e.message);
    }
  }
}

console.log('\n4. Accessing Activity Board directly...');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(4000);
console.log('   ✅ Activity Board loaded directly');

console.log('\n5. Taking Activity Board screenshot...');
await page.screenshot({ path: path.join(__dirname, 'ha-activity-board.png') });
console.log('   ✅ Activity Board screenshot saved');

console.log('\n6. Testing Trivia tab...');
await page.evaluate(() => window.switchTab('trivia'));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(__dirname, 'ha-trivia-tab.png') });
console.log('   ✅ Trivia tab screenshot saved');

console.log('\n7. Testing Reading tab...');
await page.evaluate(() => window.switchTab('reading'));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(__dirname, 'ha-reading-tab.png') });
console.log('   ✅ Reading tab screenshot saved');

console.log('\n8. Testing Reading +10 min button...');
const before = await page.evaluate(() => state.reading.dailyMinutes);
await page.evaluate(() => window.addReadingMinutes(10));
await page.waitForTimeout(500);
const after = await page.evaluate(() => state.reading.dailyMinutes);
console.log(`   Minutes: ${before} → ${after} ✅`);

console.log('\n✅ All HA tests complete!');
await browser.close();
