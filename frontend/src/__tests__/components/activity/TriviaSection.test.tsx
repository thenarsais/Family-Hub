import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TriviaSection from '@/components/activity/TriviaSection';

const { mockUseTrivia } = vi.hoisted(() => ({ mockUseTrivia: vi.fn() }));
vi.mock('@hooks/useTrivia', () => ({ useTrivia: mockUseTrivia }));

const QUESTION = {
  id: 'q1',
  question: 'What is the largest planet?',
  category: 'Space',
  difficulty: 'easy',
  options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
  hint: 'J',
  pointsValue: 10,
};

const fns = { submit: vi.fn().mockResolvedValue(undefined), refresh: vi.fn() };

function withTrivia(over: Record<string, unknown> = {}) {
  mockUseTrivia.mockReturnValue({
    question: QUESTION,
    attempt: null,
    streak: 0,
    stats: { answered: 0, correct: 0 },
    loading: false,
    error: null,
    ...fns,
    ...over,
  });
}

beforeEach(() => vi.clearAllMocks());

describe('TriviaSection', () => {
  it('shows the question and four options when unanswered', () => {
    withTrivia({ streak: 3, stats: { answered: 10, correct: 7 } });
    render(<TriviaSection />);
    expect(screen.getByText(/largest planet/i)).toBeInTheDocument();
    expect(screen.getByText(/🔥 3-day streak · 10 answered · 70% right/)).toBeInTheDocument();
    for (const opt of QUESTION.options) {
      expect(screen.getByRole('button', { name: opt })).toBeInTheDocument();
    }
  });

  it('tapping an option submits it', async () => {
    withTrivia();
    render(<TriviaSection />);
    await userEvent.click(screen.getByRole('button', { name: 'Saturn' }));
    expect(fns.submit).toHaveBeenCalledWith('Saturn');
  });

  it('after a correct answer: shows points, fun fact, and locks the options', async () => {
    withTrivia({
      attempt: {
        selectedAnswer: 'Jupiter',
        isCorrect: true,
        pointsEarned: 10,
        correctAnswer: 'Jupiter',
        funFact: '1,300 Earths fit inside.',
      },
    });
    render(<TriviaSection />);

    expect(screen.getByText(/correct! \+10 points/i)).toBeInTheDocument();
    expect(screen.getByText(/1,300 Earths fit inside/)).toBeInTheDocument();
    expect(screen.getByText(/come back tomorrow/i)).toBeInTheDocument();
    for (const opt of QUESTION.options) {
      expect(screen.getByRole('button', { name: opt })).toBeDisabled();
    }
    await userEvent.click(screen.getByRole('button', { name: 'Neptune' }));
    expect(fns.submit).not.toHaveBeenCalled();
  });

  it('after a wrong answer: names the correct option', () => {
    withTrivia({
      attempt: {
        selectedAnswer: 'Saturn',
        isCorrect: false,
        pointsEarned: 0,
        correctAnswer: 'Jupiter',
        funFact: null,
      },
    });
    render(<TriviaSection />);
    expect(screen.getByText(/not quite — it was jupiter/i)).toBeInTheDocument();
  });

  it('renders loading / error / empty-bank states', () => {
    withTrivia({ loading: true });
    const { rerender } = render(<TriviaSection />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    withTrivia({ error: 'boom' });
    rerender(<TriviaSection />);
    expect(screen.getByText('boom')).toBeInTheDocument();

    withTrivia({ question: null });
    rerender(<TriviaSection />);
    expect(screen.getByText(/no trivia today/i)).toBeInTheDocument();
  });
});
