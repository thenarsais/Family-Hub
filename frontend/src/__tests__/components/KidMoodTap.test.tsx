import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KidMoodTap from '@/components/kids/KidMoodTap';

beforeEach(() => vi.clearAllMocks());

describe('KidMoodTap', () => {
  it('renders the heading and the five faces', () => {
    render(<KidMoodTap todayMood={null} onPick={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /how do you feel/i })).toBeInTheDocument();
    for (const name of ['Great', 'Good', 'OK', 'Low', 'Sad']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('calls onPick with the chosen value', async () => {
    const onPick = vi.fn().mockResolvedValue(undefined);
    render(<KidMoodTap todayMood={null} onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));
    expect(onPick).toHaveBeenCalledWith('good');
  });

  it('marks the current mood as pressed', () => {
    render(
      <KidMoodTap
        todayMood={{ id: 'm1', userId: 'k', mood: 'great', emoji: '😄', createdAt: '' } as never}
        onPick={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Great' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('swallows an error from onPick', async () => {
    const onPick = vi.fn().mockRejectedValue(new Error('nope'));
    render(<KidMoodTap todayMood={null} onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sad' }));
    expect(onPick).toHaveBeenCalledWith('sad');
  });
});
