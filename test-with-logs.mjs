import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const logs = [];
page.on('console', msg => {
  if (msg.text().includes('applyResets')) {
    logs.push(msg.text());
    console.log('[PAGE LOG]', msg.text());
  }
});

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(5000);

console.log('\nAll applyResets logs:');
logs.forEach(l => console.log('  ', l));

const stateCheck = await page.evaluate(() => {
  return { question: !!state.trivia?.currentQuestion };
});
console.log('\nFinal question status:', stateCheck);

await browser.close();
