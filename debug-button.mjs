import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

// Intercept console messages
page.on('console', msg => console.log('[PAGE]', msg.type().toUpperCase(), msg.text()));

// Intercept popup attempts
let popupAttempted = false;
page.on('popup', popup => {
  popupAttempted = true;
  console.log('[POPUP] Attempted to open:', popup.url());
  popup.close();
});

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
if (!frame) {
  console.log('❌ Frame not found');
  await browser.close();
  process.exit(1);
}

console.log('\n=== DEBUG INFO ===');

// Get button info
const btnInfo = await frame.evaluate(() => {
  const btn = document.querySelector('.open-btn');
  return {
    tag: btn?.tagName,
    onclick: btn?.getAttribute('onclick'),
    classes: btn?.className,
    text: btn?.textContent?.trim().slice(0, 30),
    clickable: btn?.offsetParent !== null
  };
});

console.log('Button info:', btnInfo);

// Test direct onclick eval
console.log('\n=== Testing onclick evaluation ===');
const evalResult = await frame.evaluate(() => {
  const btn = document.querySelector('.open-btn');
  const onclickCode = btn?.getAttribute('onclick');
  console.log('onclick code:', onclickCode);

  try {
    const fn = new Function(onclickCode);
    fn();
    return 'Executed without error';
  } catch (e) {
    return 'Error: ' + e.message;
  }
});

console.log('Result:', evalResult);

// Test with window.open spy
console.log('\n=== Testing button click ===');
const clickResult = await frame.evaluate(() => {
  window.openCalls = [];
  const origOpen = window.open;
  window.open = function(...args) {
    window.openCalls.push(args);
    console.log('window.open called with:', args[0], args[1]);
    return null;
  };

  const btn = document.querySelector('.open-btn');
  console.log('Clicking button...');
  btn.click();

  window.open = origOpen;
  return window.openCalls.length;
});

console.log('window.open calls:', clickResult);

// Check if openBoardModal function exists
console.log('\n=== Checking openBoardModal function ===');
const fnExists = await frame.evaluate(() => {
  return typeof window.openBoardModal === 'function';
});

console.log('openBoardModal exists:', fnExists);

// Try calling it directly
if (fnExists) {
  console.log('\n=== Calling openBoardModal directly ===');
  const directCall = await frame.evaluate(() => {
    window.openCalls = [];
    const origOpen = window.open;
    window.open = function(...args) {
      window.openCalls.push(args);
      return null;
    };

    try {
      window.openBoardModal();
      window.open = origOpen;
      return { success: true, calls: window.openCalls.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  console.log('Direct call result:', directCall);
}

await browser.close();
