import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('=== HA EXPLORATION ===\n');

console.log('1. Loading HA main page...');
await page.goto('http://localhost:8123/');
await page.waitForTimeout(3000);

// Check auth
if (page.url().includes('/auth/')) {
  console.log('   Authenticating...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForURL('**/lovelace**', { timeout: 15000 });
}

await page.waitForTimeout(3000);

// Get sidebar dashboard list
console.log('\n2. Checking available dashboards...');
const dashboards = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('a[href*="/lovelace/"]'));
  return items.map(el => ({
    name: el.textContent?.trim() || 'Unknown',
    href: el.getAttribute('href'),
  })).filter(d => d.name && !d.name.includes('Development'));
});

console.log(`   Found ${dashboards.length} dashboards:`);
dashboards.forEach((d, i) => console.log(`   ${i + 1}. ${d.name}`));

// Get integrations info
console.log('\n3. Checking integrations...');
await page.goto('http://localhost:8123/config/integrations');
await page.waitForTimeout(2000);

const integrations = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('[data-testid="integration"]'));
  return items.map(el => el.textContent?.split('\n')[0]).filter(Boolean);
}).catch(() => []);

if (integrations.length > 0) {
  console.log(`   Found ${integrations.length} integrations`);
}

// Check automation count
console.log('\n4. Checking automations...');
await page.goto('http://localhost:8123/config/automation/dashboard');
await page.waitForTimeout(2000);

const automationCount = await page.evaluate(() => {
  const automations = document.querySelectorAll('[data-testid*="automation"]');
  return automations.length;
}).catch(() => 0);

console.log(`   Automations: ${automationCount || 'Unable to count'}`);

// Check scripts
console.log('\n5. Checking scripts...');
await page.goto('http://localhost:8123/config/script/dashboard');
await page.waitForTimeout(2000);

const scriptCount = await page.evaluate(() => {
  const scripts = document.querySelectorAll('[data-testid*="script"]');
  return scripts.length;
}).catch(() => 0);

console.log(`   Scripts: ${scriptCount || 'Unable to count'}`);

console.log('\n✅ Exploration complete');
await browser.close();
