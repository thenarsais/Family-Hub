import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(__dirname, 'modules', 'krish-tasks', 'krish-daily-tasks.html');
const url = 'file:///' + htmlPath.replace(/\\/g, '/');
const outDir = path.join(__dirname, 'test-screenshots');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 }); // iPhone-ish

const issues = [];

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false });
}

async function check(label, fn) {
  try {
    await fn();
    console.log('✅', label);
  } catch (e) {
    console.log('❌', label, '—', e.message.split('\n')[0]);
    issues.push({ label, error: e.message.split('\n')[0] });
    await shot('error-' + label.replace(/[^a-z0-9]/gi, '_').toLowerCase());
  }
}

// ── LOAD PAGE ──────────────────────────────────────────
await page.goto(url);
await page.waitForLoadState('networkidle');
await shot('01-dashboard');

// ── DASHBOARD: key elements visible ───────────────────
await check('Dashboard: greeting visible', async () => {
  await page.waitForSelector('#greeting-text', { timeout: 3000 });
  const text = await page.textContent('#greeting-text');
  if (!text.includes('Krish')) throw new Error('Greeting missing Krish: ' + text);
});

await check('Dashboard: date shown', async () => {
  const text = await page.textContent('#date-display');
  if (!text || text.trim() === '') throw new Error('Date display empty');
});

await check('Dashboard: Chores card visible', async () => {
  await page.waitForSelector('#db-chores-card', { timeout: 2000 });
});

await check('Dashboard: Homework card visible', async () => {
  await page.waitForSelector('#db-hw-card', { timeout: 2000 });
});

await check('Dashboard: Habits card visible', async () => {
  await page.waitForSelector('#db-habits-card', { timeout: 2000 });
});

await check('Dashboard: Mood card visible', async () => {
  await page.waitForSelector('#db-mood-card', { timeout: 2000 });
});

await check('Dashboard: Gujarati card visible', async () => {
  await page.waitForSelector('#db-guj-card', { timeout: 2000 });
});

await check('Dashboard: Points card visible', async () => {
  await page.waitForSelector('#db-pts-card', { timeout: 2000 });
});

// ── CHORES TAB ─────────────────────────────────────────
await check('Navigate to Chores tab via Full View', async () => {
  await page.click('button.db-expand >> text=Full View');
  await page.waitForSelector('#panel-chores.active', { timeout: 2000 });
});
await shot('02-chores-panel');

await check('Chores: morning block rendered', async () => {
  const items = await page.$$('.chore-item');
  if (items.length === 0) throw new Error('No chore items found');
});

await check('Chores: tap to complete a chore awards points', async () => {
  const ptsBefore = await page.textContent('#board-pts-chip');
  await page.click('.chore-item >> nth=0');
  await page.waitForTimeout(300);
  const ptsAfter = await page.textContent('#board-pts-chip');
  if (ptsBefore === ptsAfter) throw new Error('Points did not change after completing chore');
});
await shot('03-chore-ticked');

// ── HOMEWORK TAB ───────────────────────────────────────
await check('Navigate to Homework tab', async () => {
  await page.click('.b-tab[data-tab="homework"]');
  await page.waitForSelector('#panel-homework.active', { timeout: 2000 });
});
await shot('04-homework-panel');

await check('Homework: demo items rendered', async () => {
  const items = await page.$$('.hw-item');
  if (items.length === 0) throw new Error('No homework items found');
});

await check('Homework: Pomodoro launch button visible', async () => {
  await page.waitForSelector('.pomo-launch-btn', { timeout: 2000 });
});

await check('Homework: launch Pomodoro', async () => {
  await page.click('.pomo-launch-btn');
  await page.waitForSelector('.pomo-widget', { timeout: 2000 });
});
await shot('05-pomodoro-widget');

await check('Pomodoro: timer is running (auto-starts on launch)', async () => {
  await page.waitForTimeout(1200);
  const time = await page.textContent('.pomo-time');
  if (!time || time.trim() === '') throw new Error('Timer display empty');
  // Timer should have counted down from 25:00
  if (time.trim() === '25:00') throw new Error('Timer does not appear to be counting down');
});
await shot('06-pomodoro-running');

// ── KUNG FU TAB ────────────────────────────────────────
await check('Navigate to Kung Fu tab', async () => {
  await page.click('.b-tab[data-tab="kungfu"]');
  await page.waitForSelector('#panel-kungfu.active', { timeout: 2000 });
});
await shot('07-kungfu-panel');

await check('Kung Fu: goal cards rendered', async () => {
  const goals = await page.$$('.kf-goal');
  if (goals.length === 0) throw new Error('No Kung Fu goal cards found');
});

await check('Kung Fu: flash card rendered', async () => {
  await page.waitForSelector('.fc-card', { timeout: 2000 });
});

await check('Kung Fu: flip flash card', async () => {
  await page.click('.fc-flip');
  await page.waitForTimeout(600);
  const flipped = await page.$('.fc-card.flipped');
  if (!flipped) throw new Error('Flash card did not flip');
});
await shot('08-flashcard-flipped');

// ── GUJARATI TAB ───────────────────────────────────────
await check('Navigate to Gujarati tab', async () => {
  await page.click('.b-tab[data-tab="gujarati"]');
  await page.waitForSelector('#panel-gujarati.active', { timeout: 2000 });
});
await shot('09-gujarati-panel');

await check('Gujarati: timer display visible', async () => {
  await page.waitForSelector('.guj-timer-display', { timeout: 2000 });
});

await check('Gujarati: start/stop timer buttons', async () => {
  await page.click('.gtb-start');
  await page.waitForTimeout(1200);
  await page.click('.gtb-stop');
  const mins = await page.textContent('.guj-timer-display');
  if (!mins) throw new Error('Timer display missing after stop');
});

// ── CALENDAR TAB ───────────────────────────────────────
await check('Navigate to Calendar tab', async () => {
  await page.click('.b-tab[data-tab="calendar"]');
  await page.waitForSelector('#panel-calendar.active', { timeout: 2000 });
});
await shot('10-calendar-panel');

await check('Calendar: demo events rendered', async () => {
  const events = await page.$$('.event-item');
  if (events.length === 0) throw new Error('No calendar events found');
});

await check('Calendar: add event form visible', async () => {
  await page.waitForSelector('.cal-add-form', { timeout: 2000 });
});

// ── HABITS TAB ─────────────────────────────────────────
await check('Navigate to Habits tab', async () => {
  await page.click('.b-tab[data-tab="habits"]');
  await page.waitForSelector('#panel-habits.active', { timeout: 2000 });
});
await shot('11-habits-panel');

await check('Habits: habit cards rendered', async () => {
  const cards = await page.$$('.habit-card');
  if (cards.length === 0) throw new Error('No habit cards found');
});

await check('Habits: 7-day grid visible', async () => {
  const days = await page.$$('.hday');
  if (days.length === 0) throw new Error('No habit day cells found');
});

// ── MOOD TAB ───────────────────────────────────────────
await check('Navigate to Mood tab', async () => {
  await page.click('.b-tab[data-tab="mood"]');
  await page.waitForSelector('#panel-mood.active', { timeout: 2000 });
});
await shot('12-mood-panel');

await check('Mood: 5 emoji options visible', async () => {
  const opts = await page.$$('.mood-opt');
  if (opts.length !== 5) throw new Error('Expected 5 mood options, got ' + opts.length);
});

await check('Mood: select a mood awards points', async () => {
  const ptsBefore = await page.textContent('#board-pts-chip');
  await page.click('.mood-opt:nth-child(2)');
  await page.waitForTimeout(300);
  const ptsAfter = await page.textContent('#board-pts-chip');
  if (ptsBefore === ptsAfter) throw new Error('Points did not change after mood selection');
});
await shot('13-mood-selected');

// ── POINTS TAB ─────────────────────────────────────────
await check('Navigate to Points tab', async () => {
  await page.click('.b-tab[data-tab="points"]');
  await page.waitForSelector('#panel-points.active', { timeout: 2000 });
});
await shot('14-points-panel');

await check('Points: tier card visible', async () => {
  await page.waitForSelector('.pts-tier-card', { timeout: 2000 });
});

await check('Points: stats row visible (today/week/month)', async () => {
  const stats = await page.$$('.pts-stat');
  if (stats.length < 3) throw new Error('Expected ≥3 stats, got ' + stats.length);
});

// ── BACK TO DASHBOARD ──────────────────────────────────
await check('Back button returns to dashboard', async () => {
  await page.click('.back-btn');
  await page.waitForSelector('#view-dashboard.active', { timeout: 2000 });
});
await shot('15-back-to-dashboard');

// ── FINAL REPORT ──────────────────────────────────────
await browser.close();

console.log('\n══════════════════════════════════');
if (issues.length === 0) {
  console.log('All checks passed ✅');
} else {
  console.log(`${issues.length} issue(s) found:`);
  issues.forEach(i => console.log(' •', i.label, '—', i.error));
}
console.log('Screenshots saved to: test-screenshots/');
