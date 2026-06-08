import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const logs = [];
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('[') || text.includes('trivia')) {
    logs.push(text);
  }
});

console.log('=== Loading page ===');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);

console.log('\n=== Clearing LS and reloading ===');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(5000);

console.log('\n=== Captured logs ===');
logs.forEach(l => console.log(l));

console.log('\n=== Final check ===');
const check = await page.evaluate(() => ({
  hasTrivia: !!state.trivia,
  hasQuestion: !!state.trivia?.currentQuestion,
}));
console.log(check);

await browser.close();
