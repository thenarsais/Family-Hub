import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);

const stateInfo = await page.evaluate(() => {
  return {
    stateExists: !!window.state,
    triviaExists: !!window.state?.trivia,
    triviaKeys: window.state?.trivia ? Object.keys(window.state.trivia) : null,
    currentQuestion: window.state?.trivia?.currentQuestion,
    getTriviaQExists: typeof window.getTriviaQuestion === 'function',
  };
});

console.log(JSON.stringify(stateInfo, null, 2));

await browser.close();
