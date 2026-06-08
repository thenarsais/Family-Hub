import { chromium } from 'playwright';
import path from 'path'; import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

console.log('Loading Activity Board...');
await page.goto('http://localhost:8123/local/krish-tasks/krish-daily-tasks.html');
await page.waitForTimeout(5000);

// Check current tab
const currentTab = await page.evaluate(() => window.currentTab);
console.log('Current tab:', currentTab);

// Take screenshot of initial state
console.log('\n1. Initial Dashboard View');
await page.screenshot({ path: path.join(__dirname, 'ab-01-dashboard.png') });

// Click Trivia tab button directly
console.log('\n2. Clicking Trivia tab...');
await page.click('button[data-tab="trivia"]');
await page.waitForTimeout(2000);

const triviaTab = await page.evaluate(() => window.currentTab);
console.log('   Current tab after click:', triviaTab);

const triviaText = await page.evaluate(() => {
  return document.getElementById('panel-trivia')?.innerText?.slice(0, 100) || 'NOT FOUND';
});
console.log('   Panel content:', triviaText);

await page.screenshot({ path: path.join(__dirname, 'ab-02-trivia.png') });
console.log('   ✅ Trivia screenshot saved');

// Test Trivia functionality
console.log('\n3. Testing Trivia answer...');
const triviaState1 = await page.evaluate(() => ({
  question: state.trivia.currentQuestion?.q?.slice(0, 30),
  answered: state.trivia.todayAnswered,
  points: state.points.today,
}));
console.log('   Before:', triviaState1);

// Type answer
const answer = await page.evaluate(() => state.trivia.currentQuestion.a);
await page.fill('#trivia-answer', answer);
await page.click('button:has-text("Check Answer")');
await page.waitForTimeout(1000);

const triviaState2 = await page.evaluate(() => ({
  answered: state.trivia.todayAnswered,
  points: state.points.today,
  streak: state.trivia.streak,
}));
console.log('   After:', triviaState2);
await page.screenshot({ path: path.join(__dirname, 'ab-03-trivia-answered.png') });

// Click Reading tab
console.log('\n4. Clicking Reading tab...');
await page.click('button[data-tab="reading"]');
await page.waitForTimeout(2000);

const readingTab = await page.evaluate(() => window.currentTab);
console.log('   Current tab after click:', readingTab);

const readingText = await page.evaluate(() => {
  return document.getElementById('panel-reading')?.innerText?.slice(0, 100) || 'NOT FOUND';
});
console.log('   Panel content:', readingText);

await page.screenshot({ path: path.join(__dirname, 'ab-04-reading.png') });
console.log('   ✅ Reading screenshot saved');

// Test Reading functionality
console.log('\n5. Testing Reading buttons...');
const readingBefore = await page.evaluate(() => state.reading.dailyMinutes);
console.log('   Minutes before:', readingBefore);

await page.evaluate(() => window.addReadingMinutes(20));
await page.waitForTimeout(500);

const readingAfter = await page.evaluate(() => ({
  daily: state.reading.dailyMinutes,
  weekly: state.reading.weeklyMinutes,
  points: state.points.today,
}));
console.log('   After +20 min:', readingAfter);

await page.screenshot({ path: path.join(__dirname, 'ab-05-reading-logged.png') });
console.log('   ✅ Reading logged screenshot saved');

console.log('\n✅ All tab tests complete!');
await browser.close();
