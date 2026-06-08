import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Listen for console messages
page.on('console', msg => {
  if (msg.type() === 'error') console.log('[PAGE ERROR]', msg.text());
  if (msg.text().includes('trivia') || msg.text().includes('Trivia')) {
    console.log('[PAGE LOG]', msg.text());
  }
});

await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(3000);

// Check state
const stateInfo = await page.evaluate(() => {
  return {
    hasTrivia: !!window.state?.trivia,
    triviaStreak: window.state?.trivia?.streak,
    hasQuestion: !!window.state?.trivia?.currentQuestion,
    questionText: window.state?.trivia?.currentQuestion?.q?.slice(0, 50),
  };
});

console.log('State trivia info:', stateInfo);

// Check if getTriviaQuestion function exists
const fnExists = await page.evaluate(() => typeof getTriviaQuestion === 'function');
console.log('getTriviaQuestion function exists:', fnExists);

// Try calling it directly
const testQ = await page.evaluate(() => {
  if (typeof getTriviaQuestion === 'function') {
    const today = new Date().toISOString().split('T')[0];
    return getTriviaQuestion(today);
  }
  return null;
});

console.log('Direct getTriviaQuestion call:', testQ);

await browser.close();
