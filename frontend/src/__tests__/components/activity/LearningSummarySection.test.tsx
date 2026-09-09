import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LearningSummarySection from '@/components/activity/LearningSummarySection';

const { mockUseLearning } = vi.hoisted(() => ({ mockUseLearning: vi.fn() }));
vi.mock('@hooks/useLearning', () => ({ useLearning: mockUseLearning }));

const renderIt = () =>
  render(
    <MemoryRouter>
      <LearningSummarySection />
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('LearningSummarySection', () => {
  it('shows a loading note', () => {
    mockUseLearning.mockReturnValue({ loading: true, stats: {} });
    renderIt();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders totals, per-category bars and a Continue link', () => {
    mockUseLearning.mockReturnValue({
      loading: false,
      stats: {
        totalLessonsCompleted: 8,
        totalPointsEarned: 80,
        alphabet: { completed: 5, total: 47 },
        numbers: { completed: 3, total: 10 },
        vocabulary: { completed: 0, total: 120 },
      },
    });
    renderIt();

    expect(screen.getByText(/8 \/ 177 lessons · 80 points/i)).toBeInTheDocument();
    expect(screen.getByText('Alphabet')).toBeInTheDocument();
    expect(screen.getByText('5 / 47')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /continue/i });
    expect(link).toHaveAttribute('href', '/learn');
  });
});
