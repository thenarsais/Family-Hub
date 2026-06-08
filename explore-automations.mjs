import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

console.log('=== HA AUTOMATIONS EXPLORATION ===\n');

await page.goto('http://localhost:8123/config/automation/dashboard');
await page.waitForTimeout(3000);

if (page.url().includes('/auth/')) {
  console.log('Authenticating...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(4000);
}

await page.goto('http://localhost:8123/config/automation/dashboard');
await page.waitForTimeout(3000);

console.log('1. Checking automations dashboard...');
const automationText = await page.evaluate(() => {
  return document.body.innerText;
});

// Count automations by looking for common patterns
const automationCount = (automationText.match(/automation\./g) || []).length;
console.log(`   Found references to ~${Math.max(automationCount / 2, 0) | 0} automations\n`);

// Look for automation names
const lines = automationText.split('\n').filter(l => 
  l.includes('automation') || l.includes('trigger') || l.includes('action')
).slice(0, 20);

console.log('2. Automation references found:');
lines.forEach(l => {
  if (l.trim().length > 0 && l.trim().length < 100) {
    console.log(`   ${l.trim().slice(0, 80)}`);
  }
});

console.log('\n3. Checking automations.yaml file...');
const checkYaml = await page.evaluate(() => {
  return 'Cannot read files from browser, need to check locally';
});

console.log('   ℹ️ Checking local automations.yaml file...\n');

await browser.close();
