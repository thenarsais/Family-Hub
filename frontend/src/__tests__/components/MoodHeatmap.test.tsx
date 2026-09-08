import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MoodHeatmap from '@/components/family/MoodHeatmap';

const { mockUseFamilyMoodHistory } = vi.hoisted(() => ({ mockUseFamilyMoodHistory: vi.fn() }));
vi.mock('@hooks/useHabits', async () => {
  const actual = await vi.importActual<typeof import('@hooks/useHabits')>('@hooks/useHabits');
  return { ...actual, useFamilyMoodHistory: mockUseFamilyMoodHistory };
});

beforeEach(() => vi.clearAllMocks());

describe('MoodHeatmap', () => {
  it('renders a row per member and the legend', async () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`;
    mockUseFamilyMoodHistory.mockReturnValue({
      history: [
        { userId: 'k', assigneeName: 'Krish', day: iso, mood: 'good', emoji: '🙂' },
        { userId: 'a', assigneeName: 'Karishma', day: iso, mood: 'great', emoji: '😄' },
      ],
      loading: false,
      forbidden: false,
    });
    render(<MoodHeatmap />);

    expect(screen.getByText('Mood over time')).toBeInTheDocument();
    expect(screen.getByText('Krish')).toBeInTheDocument();
    expect(screen.getByText('Karishma')).toBeInTheDocument();
    // legend labels
    expect(screen.getByText('Great')).toBeInTheDocument();
    expect(screen.getByText('Sad')).toBeInTheDocument();
    // a cell for today's logged mood
    await waitFor(() =>
      expect(screen.getByTitle(new RegExp(`${iso}: Good`))).toBeInTheDocument(),
    );
  });

  it('renders nothing when the caller is forbidden', () => {
    mockUseFamilyMoodHistory.mockReturnValue({ history: [], loading: false, forbidden: true });
    const { container } = render(<MoodHeatmap />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an empty state with no check-ins', () => {
    mockUseFamilyMoodHistory.mockReturnValue({ history: [], loading: false, forbidden: false });
    render(<MoodHeatmap />);
    expect(screen.getByText(/no mood check-ins yet/i)).toBeInTheDocument();
  });

  it('shows a spinner while loading', () => {
    mockUseFamilyMoodHistory.mockReturnValue({ history: [], loading: true, forbidden: false });
    render(<MoodHeatmap />);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });
});
