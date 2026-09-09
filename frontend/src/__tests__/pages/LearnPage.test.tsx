import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LearnPage from '@/pages/LearnPage';

const { mockUseLearning, mockUseSpeak } = vi.hoisted(() => ({
  mockUseLearning: vi.fn(),
  mockUseSpeak: vi.fn(),
}));
vi.mock('@hooks/useLearning', () => ({ useLearning: mockUseLearning }));
vi.mock('@hooks/useSpeak', () => ({ useSpeak: mockUseSpeak }));

const lesson = (id: string, sub: string, text: string, english: string) => ({
  id,
  category: sub === 'digits' ? 'numbers' : 'alphabet',
  phase: 'phase_1_alphabet',
  subcategory: sub,
  sequenceOrder: 0,
  content: { text, romanization: english, pronunciation: `say ${english}`, english },
  pointsValue: 10,
  completed: false,
  pointsEarned: 0,
});

const LESSONS = [
  lesson('l1', 'vowels', 'અ', 'vowel a'),
  lesson('l2', 'vowels', 'આ', 'vowel aa'),
  lesson('l3', 'vowels', 'ઇ', 'vowel i'),
  lesson('l5', 'vowels', 'ઈ', 'vowel ii'),
  lesson('l6', 'vowels', 'ઉ', 'vowel u'),
  lesson('l4', 'consonants', 'ક', 'ka'),
];

const STATS = {
  totalLessonsCompleted: 0,
  totalPointsEarned: 0,
  alphabet: { completed: 0, total: 47 },
  numbers: { completed: 0, total: 10 },
  vocabulary: { completed: 0, total: 120 },
};

const fns = {
  completeLesson: vi.fn().mockResolvedValue(undefined),
  recordQuizAnswer: vi.fn().mockResolvedValue(true),
  refresh: vi.fn(),
};

function withLearning(over: Record<string, unknown> = {}) {
  const lessons = (over.lessons as typeof LESSONS) ?? LESSONS;
  const byPhase: Record<string, Record<string, typeof LESSONS>> = {};
  for (const l of lessons) {
    (byPhase[l.phase] ??= {})[l.subcategory] ??= [];
    byPhase[l.phase][l.subcategory].push(l);
  }
  mockUseLearning.mockReturnValue({
    lessons,
    byPhase,
    stats: STATS,
    loading: false,
    error: null,
    ...fns,
    ...over,
  });
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <LearnPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSpeak.mockReturnValue({ supported: true, hasGujaratiVoice: false, speak: vi.fn() });
});

describe('LearnPage', () => {
  it('home shows the three phase cards and overall progress', () => {
    withLearning();
    renderPage();
    expect(screen.getByRole('heading', { name: /gujarati/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /alphabet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /numbers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vocabulary/i })).toBeInTheDocument();
    expect(screen.getByText(/0 of 177 lessons/i)).toBeInTheDocument();
  });

  it('opening a phase lists its subcategory chips', async () => {
    withLearning();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
    expect(screen.getByRole('heading', { name: /^Vowels$/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Consonants$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'vowel a' })).toBeInTheDocument();
  });

  it('tapping a chip enters Learn mode; "Got it" completes and advances', async () => {
    withLearning();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
    await userEvent.click(screen.getByRole('button', { name: 'vowel a' }));

    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    expect(screen.getByText('say vowel a')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hear it/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect(fns.completeLesson).toHaveBeenCalledWith('l1');
    expect(screen.getByText('2 / 5')).toBeInTheDocument();
  });

  it('runs a quiz: answering reveals correctness and records it', async () => {
    withLearning();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
    // the vowels section (3 lessons) has an enabled "Quiz this section"
    const quizBtn = screen
      .getAllByRole('button', { name: /quiz this section/i })
      .find((b) => !(b as HTMLButtonElement).disabled)!;
    await userEvent.click(quizBtn);

    expect(screen.getByText(/question 1 \/ 5/i)).toBeInTheDocument();
    const options = screen
      .getAllByRole('button')
      .filter((b) => b.className.includes('rounded-xl border-2'));
    expect(options.length).toBe(4);
    await userEvent.click(options[0]);
    expect(fns.recordQuizAnswer).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /next|see score/i })).toBeInTheDocument();
  });

  it('Back returns to the phase list then home', async () => {
    withLearning();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/0 of 177 lessons/i)).toBeInTheDocument();
  });

  it('hides the Hear it button when speech is unsupported', async () => {
    mockUseSpeak.mockReturnValue({ supported: false, hasGujaratiVoice: false, speak: vi.fn() });
    withLearning();
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
    await userEvent.click(screen.getByRole('button', { name: 'vowel a' }));
    expect(screen.queryByRole('button', { name: /hear it/i })).not.toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    withLearning({ loading: true });
    renderPage();
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  it('surfaces the hook error', () => {
    withLearning({ error: 'network is down' });
    renderPage();
    expect(screen.getByText('network is down')).toBeInTheDocument();
  });

  it('quiz: answering every question lands on the score screen', async () => {
    withLearning({ lessons: LESSONS.filter((l) => l.subcategory === 'vowels') });
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
    await userEvent.click(
      screen.getAllByRole('button', { name: /quiz this section/i }).find((b) => !(b as HTMLButtonElement).disabled)!,
    );

    // 5 vowels → 5 questions; answer + advance through each
    for (let i = 0; i < 5; i += 1) {
      const opts = screen.getAllByRole('button').filter((b) => b.className.includes('rounded-xl border-2'));
      await userEvent.click(opts[0]);
      await userEvent.click(screen.getByRole('button', { name: /next|see score/i }));
    }
    expect(screen.getByText(/\d \/ 5/)).toBeInTheDocument();
    expect(screen.getByText(/\+\d+ points/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^done$/i }));
    // back on the browse view
    expect(screen.getByRole('heading', { name: /^Vowels$/ })).toBeInTheDocument();
  });

  it('learn: the last card says Finish and returns to browse', async () => {
    withLearning({ lessons: [LESSONS[0]] }); // one vowel only
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
    await userEvent.click(screen.getByRole('button', { name: 'vowel a' }));

    const finish = screen.getByRole('button', { name: /finish/i });
    await userEvent.click(finish);
    expect(fns.completeLesson).toHaveBeenCalledWith('l1');
    expect(screen.getByRole('heading', { name: /^Vowels$/ })).toBeInTheDocument();
  });
});
