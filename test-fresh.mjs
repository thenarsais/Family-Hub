import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const profileDir = path.join(__dirname, '.test-profile');

// Clear old profile
if (fs.existsSync(profileDir)) {
  fs.rmSync(profileDir, { recursive: true });
}

const browser = await chromium.launchPersistentContext(profileDir, {
  headless: true,
  ignoreHTTPSErrors: true,
  chromiumSandbox: false
});

const page = await browser.newPage();
page.setDefaultNavigationTimeout(15000);
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading dashboard (fresh profile)...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

if (page.url().includes('/auth/')) {
  console.log('Logging in...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/family-hub**', { timeout: 15000 });
}

await page.waitForTimeout(6000);

const frame = page.frames().find(f => f.url().includes('krish-summary-card'));
if (!frame) {
  console.log('❌ Frame not found');
  await browser.close();
  process.exit(1);
}

// Check button
const btnInfo = await frame.evaluate(() => {
  const btn = document.querySelector('.open-btn');
  return {
    type: btn?.tagName,
    onclick_attr: btn?.getAttribute('onclick'),
    html: btn?.outerHTML?.slice(0, 100)
  };
});

console.log('Button:', btnInfo);

if (btnInfo.type !== 'BUTTON') {
  console.log('❌ Button is not a BUTTON element, still cached as', btnInfo.type);
  await browser.close();
  process.exit(1);
}

if (!btnInfo.onclick_attr) {
  console.log('❌ No onclick attribute');
  await browser.close();
  process.exit(1);
}

console.log('✅ Button element with onclick found');

// Test onclick
const result = await frame.evaluate(() => {
  let called = false;
  window.testOpenBoard = function() {
    called = true;
  };
  const btn = document.querySelector('.open-btn');
  // Simulate the click that should trigger the function
  try {
    const fn = btn.getAttribute('onclick');
    eval(fn);
    return called;
  } catch (e) {
    return false;
  }
});

console.log('onclick eval result:', result);

// Test actual click
const clickResult = await frame.evaluate(() => {
  let winOpenCalled = false;
  const origOpen = window.open;
  window.open = function() {
    winOpenCalled = true;
    return null;
  };
  document.querySelector('.open-btn').click();
  window.open = origOpen;
  return winOpenCalled;
});

if (clickResult) {
  console.log('✅ Click triggered window.open()');
} else {
  console.log('❌ Click did not trigger window.open()');
}

await browser.close();
