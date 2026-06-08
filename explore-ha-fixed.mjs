import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('=== HA SETUP EXPLORATION ===\n');

console.log('1. Loading HA...');
await page.goto('http://localhost:8123/');
await page.waitForTimeout(3000);

if (page.url().includes('/auth/')) {
  console.log('   Authenticating...');
  await page.locator('input').nth(0).fill('pxnarsai');
  await page.locator('input[type="password"]').fill('playwright-temp-123');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
}

// Get to dashboard
console.log('\n2. Taking screenshot of main dashboard...');
await page.goto('http://localhost:8123/');
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(__dirname, 'ha-main-overview.png') });
console.log('   ✅ Overview screenshot saved');

// Check sidebar for dashboards
console.log('\n3. Exploring dashboards...');
const sidebarText = await page.evaluate(() => {
  const sidebar = document.querySelector('ha-drawer') || document.querySelector('nav');
  return sidebar ? sidebar.innerText : 'No sidebar found';
});

const dashboardMatches = sidebarText.match(/Dashboard|Overview|Family|Krish|Activity/gi) || [];
console.log(`   Found references: ${dashboardMatches.join(', ')}`);

// Look for specific dashboard links
const dashlinks = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a'));
  return links
    .filter(a => a.href.includes('lovelace') || a.textContent.includes('Dash'))
    .map(a => ({ text: a.textContent.trim(), href: a.href }))
    .slice(0, 10);
});

console.log(`\n   Dashboard links found: ${dashlinks.length}`);
dashlinks.forEach(d => console.log(`     • ${d.text}`));

// Check for development tools
console.log('\n4. Checking config access...');
const hasConfig = await page.evaluate(() => {
  return !!document.querySelector('a[href*="/config/"]');
});
console.log(`   Config accessible: ${hasConfig ? 'Yes' : 'No'}`);

// Get sidebar screenshot
console.log('\n5. Taking sidebar screenshot...');
await page.screenshot({ path: path.join(__dirname, 'ha-sidebar.png') });
console.log('   ✅ Sidebar screenshot saved');

// Navigate to Family Hub dashboard specifically
console.log('\n6. Looking for Family Hub dashboard...');
await page.goto('http://localhost:8123/family-hub/0', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);

console.log('   ✅ Family Hub dashboard loaded');
await page.screenshot({ path: path.join(__dirname, 'ha-family-hub.png') });
console.log('   ✅ Family Hub screenshot saved');

console.log('\n✅ Exploration complete!');
await browser.close();
