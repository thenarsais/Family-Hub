import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MoodCheckIn from '@/components/activity/MoodCheckIn';

beforeEach(() => vi.clearAllMocks());

describe('MoodCheckIn', () => {
  it('prompts and renders all five faces when nothing is logged', () => {
    render(<MoodCheckIn todayMood={null} onPick={vi.fn()} />);
    expect(screen.getByText(/how are you feeling today/i)).toBeInTheDocument();
    ['Great', 'Good', 'OK', 'Low', 'Sad'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });
  });

  it('marks the logged mood as pressed and shows the "change" copy', () => {
    render(
      <MoodCheckIn
        todayMood={{ id: 'm1', userId: 'u1', mood: 'good', recordedAt: '' } as never}
        onPick={vi.fn()}
      />,
    );
    expect(screen.getByText(/tap to change/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Great' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onPick with the chosen value', async () => {
    const onPick = vi.fn().mockResolvedValue(undefined);
    render(<MoodCheckIn todayMood={null} onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sad' }));
    expect(onPick).toHaveBeenCalledWith('sad');
  });

  it('swallows an error from onPick', async () => {
    const onPick = vi.fn().mockRejectedValue(new Error('nope'));
    render(<MoodCheckIn todayMood={null} onPick={onPick} />);
    await userEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onPick).toHaveBeenCalledWith('ok');
  });
});
