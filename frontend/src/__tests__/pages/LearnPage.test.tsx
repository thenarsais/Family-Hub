import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  traced: false,
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
  traceLesson: vi.fn().mockResolvedValue({ alreadyTraced: false }),
  recordQuizAnswer: vi.fn().mockResolvedValue(true),
  refresh: vi.fn(),
};

/** Simulates one finished pen stroke on the trace canvas -- no accuracy check,
 * every pointerdown→pointerup pair counts. */
function traceStroke(canvas: Element) {
  fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
}

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
  // jsdom has no real canvas backend; the trace canvas already treats a null
  // 2d context as "skip drawing" (see LearnPage's TraceCanvas), this just
  // silences jsdom's noisy "not implemented" console.error for it.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
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

  describe('trace mode (T-25 / FR-143)', () => {
    it('the pencil icon opens Trace mode, independent of Learn/Quiz', async () => {
      withLearning();
      const { container } = renderPage();
      await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Trace vowel a' }));

      expect(screen.getByText('1 / 5')).toBeInTheDocument();
      expect(container.querySelector('canvas')).toBeInTheDocument();
      expect(screen.getByText('vowel a · vowel a')).toBeInTheDocument();
      // no gating: Learn/completeLesson was never called to get here
      expect(fns.completeLesson).not.toHaveBeenCalled();
    });

    it('Done stays disabled until 10 strokes, then awards points and advances', async () => {
      withLearning();
      const { container } = renderPage();
      await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Trace vowel a' }));

      const canvas = container.querySelector('canvas')!;
      const done = screen.getByRole('button', { name: /done — \+15 pts/i });
      expect(done).toBeDisabled();

      for (let i = 0; i < 9; i += 1) traceStroke(canvas);
      expect(screen.getByText('Traces: 9 / 10')).toBeInTheDocument();
      expect(done).toBeDisabled();

      traceStroke(canvas);
      expect(screen.getByText('Traces: 10 / 10')).toBeInTheDocument();
      expect(done).not.toBeDisabled();

      await userEvent.click(done);
      expect(fns.traceLesson).toHaveBeenCalledWith('l1');
      expect(await screen.findByText(/traced! \+15 points/i)).toBeInTheDocument();

      // once earned, the canvas ignores further pointer input (no practicing UI to return to)
      traceStroke(canvas);
      expect(screen.getByText(/traced! \+15 points/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /^next$/i }));
      expect(screen.getByText('2 / 5')).toBeInTheDocument();
    });

    it('re-tracing an already-traced lesson shows practice-only messaging', async () => {
      fns.traceLesson.mockResolvedValueOnce({ alreadyTraced: true });
      withLearning({ lessons: LESSONS.map((l) => (l.id === 'l1' ? { ...l, traced: true } : l)) });
      const { container } = renderPage();
      await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
      // the traced lesson's icon announces it's already been practiced
      expect(screen.getByRole('button', { name: /trace vowel a, practiced/i })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /trace vowel a, practiced/i }));
      const canvas = container.querySelector('canvas')!;
      for (let i = 0; i < 10; i += 1) traceStroke(canvas);

      const done = screen.getByRole('button', { name: /done \(practice\)/i });
      await userEvent.click(done);
      expect(screen.getByText(/already earned for this one/i)).toBeInTheDocument();
    });

    it('draws on a real 2d context when one is available, and Clear resets it', async () => {
      const ctx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        clearRect: vi.fn(),
        lineWidth: 0,
        lineCap: '',
        strokeStyle: '',
      };
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);

      withLearning();
      const { container } = renderPage();
      await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Trace vowel a' }));
      const canvas = container.querySelector('canvas')!;

      // a stray pointerup/leave with no pointerdown first is a no-op, not a stroke
      fireEvent.pointerLeave(canvas);
      expect(screen.getByText('Traces: 0 / 10')).toBeInTheDocument();

      traceStroke(canvas);
      expect(ctx.beginPath).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: /clear/i }));
      expect(ctx.clearRect).toHaveBeenCalled();
    });

    it('shows an inline error and stays practicing when saving the trace fails', async () => {
      fns.traceLesson.mockRejectedValueOnce(new Error('offline'));
      withLearning();
      const { container } = renderPage();
      await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Trace vowel a' }));

      const canvas = container.querySelector('canvas')!;
      for (let i = 0; i < 10; i += 1) traceStroke(canvas);
      await userEvent.click(screen.getByRole('button', { name: /done — \+15 pts/i }));

      expect(await screen.findByText(/couldn't save that trace/i)).toBeInTheDocument();
      // still practicing -- no success message, Done is available to retry
      expect(screen.getByRole('button', { name: /done — \+15 pts/i })).not.toBeDisabled();
    });

    it('Skip and Previous move through the lesson list without tracing', async () => {
      withLearning();
      renderPage();
      await userEvent.click(screen.getByRole('button', { name: /alphabet/i }));
      await userEvent.click(screen.getByRole('button', { name: 'Trace vowel a' }));

      await userEvent.click(screen.getByRole('button', { name: /skip/i }));
      expect(screen.getByText('2 / 5')).toBeInTheDocument();
      expect(fns.traceLesson).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: /previous/i }));
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });
  });
});
