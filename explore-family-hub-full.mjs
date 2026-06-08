import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 1200 });

console.log('Exploring Family Hub dashboard...\n');

await page.goto('http://localhost:8123/family-hub/0');
await page.waitForTimeout(4000);

console.log('1. Full Family Hub screenshot (scrolled)...');
// Scroll down to see all content
await page.evaluate(() => window.scrollBy(0, 800));
await page.waitForTimeout(1000);

await page.screenshot({ path: path.join(__dirname, 'ha-family-hub-full.png') });
console.log('   ✅ Full dashboard screenshot saved');

console.log('\n2. Checking dashboard structure...');
const structure = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('[class*="card"]'));
  const titles = Array.from(document.querySelectorAll('h1, h2, h3, .card-title'));
  
  return {
    cardCount: cards.length,
    titles: titles.map(t => t.textContent.trim()).filter(t => t && t.length < 100).slice(0, 15),
  };
});

console.log(`   Cards found: ${structure.cardCount}`);
console.log('   Titles/Sections:');
structure.titles.forEach(t => console.log(`     • ${t}`));

console.log('\n✅ Exploration complete');
await browser.close();
