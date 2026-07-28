import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading Activity Board...');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

console.log('Finding and clicking Trivia tab...');
const triviaBtn = await page.$('button[data-tab="trivia"]');
if (!triviaBtn) {
  console.log('❌ Trivia button not found');
  await browser.close();
  process.exit(1);
}

// Scroll into view and click with force
await page.evaluate(() => {
  const btn = document.querySelector('button[data-tab="trivia"]');
  if (btn) btn.scrollIntoView({ inline: 'center' });
});
await page.waitForTimeout(500);
await triviaBtn.click({ force: true });
await page.waitForTimeout(2000);

console.log('✅ Trivia tab clicked');
console.log('Taking screenshot...');
await page.screenshot({ path: path.join(__dirname, 'trivia-board.png') });
console.log('✅ Screenshot saved');

await browser.close();
