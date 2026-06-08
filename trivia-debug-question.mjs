import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(5000);

const questionInfo = await page.evaluate(() => {
  return {
    currentQuestion: state.trivia.currentQuestion,
    currentQType: typeof state.trivia.currentQuestion,
    triviaKeys: Object.keys(state.trivia),
  };
});

console.log(JSON.stringify(questionInfo, null, 2));

await browser.close();
