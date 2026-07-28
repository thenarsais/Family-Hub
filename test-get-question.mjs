import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(3000);

const question = await page.evaluate(() => {
  const today = new Date().toISOString().split('T')[0];
  const q = getTriviaQuestion(today);
  return {
    today: today,
    question: q,
    hasQuestion: !!q,
  };
});

console.log(JSON.stringify(question, null, 2));

await browser.close();
