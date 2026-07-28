import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading Activity Board...');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);

// Switch to board view first by calling showBoard
console.log('\n1. Switching to Activity Board view...');
await page.evaluate(() => window.showBoard('chores'));
await page.waitForTimeout(1500);

// Check if tabs are now visible
const hasTrivia = await page.evaluate(() => {
  return !!document.querySelector('button[data-tab="trivia"]');
});
console.log(`   Trivia tab visible: ${hasTrivia}`);

await page.screenshot({ path: path.join(__dirname, 'ab-01-board-chores.png') });
console.log('   ✅ Board view screenshot');

// Click Trivia tab
console.log('\n2. Clicking Trivia tab...');
await page.evaluate(() => window.switchTab('trivia'));
await page.waitForTimeout(1500);

const triviaContent = await page.evaluate(() => {
  const panel = document.getElementById('panel-trivia');
  return {
    visible: panel?.offsetParent !== null,
    text: panel?.innerText?.split('\n')[0] || 'NOT FOUND',
    question: state.trivia?.currentQuestion?.q?.slice(0, 40),
  };
});
console.log('   Trivia panel:', triviaContent);

await page.screenshot({ path: path.join(__dirname, 'ab-02-trivia.png') });
console.log('   ✅ Trivia screenshot saved');

// Answer the trivia question
console.log('\n3. Testing Trivia answer...');
const correctAnswer = await page.evaluate(() => state.trivia.currentQuestion.a);
console.log(`   Correct answer: "${correctAnswer}"`);

await page.evaluate((ans) => {
  const input = document.getElementById('trivia-answer');
  input.value = ans;
}, correctAnswer);

await page.evaluate(() => window.checkTriviaAnswer());
await page.waitForTimeout(1000);

const triviaResult = await page.evaluate(() => ({
  answered: state.trivia.todayAnswered,
  streak: state.trivia.streak,
  points: state.points.today,
}));
console.log('   Result:', triviaResult);

await page.screenshot({ path: path.join(__dirname, 'ab-03-trivia-answered.png') });
console.log('   ✅ Trivia answered screenshot');

// Click Reading tab
console.log('\n4. Clicking Reading tab...');
await page.evaluate(() => window.switchTab('reading'));
await page.waitForTimeout(1500);

const readingContent = await page.evaluate(() => {
  const panel = document.getElementById('panel-reading');
  return {
    visible: panel?.offsetParent !== null,
    text: panel?.innerText?.split('\n')[0] || 'NOT FOUND',
    dailyMinutes: state.reading.dailyMinutes,
  };
});
console.log('   Reading panel:', readingContent);

await page.screenshot({ path: path.join(__dirname, 'ab-04-reading.png') });
console.log('   ✅ Reading screenshot saved');

// Test Reading buttons
console.log('\n5. Testing Reading +20 min...');
await page.evaluate(() => window.addReadingMinutes(20));
await page.waitForTimeout(500);

const readingResult = await page.evaluate(() => ({
  daily: state.reading.dailyMinutes,
  weekly: state.reading.weeklyMinutes,
  points: state.points.today,
}));
console.log('   Result:', readingResult);

await page.screenshot({ path: path.join(__dirname, 'ab-05-reading-logged.png') });
console.log('   ✅ Reading logged screenshot');

console.log('\n✅ All Activity Board tests complete!');
await browser.close();
