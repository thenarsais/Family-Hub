import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RemindersPage from '@/pages/RemindersPage';

const { hook, useFamily, useAuth } = vi.hoisted(() => ({
  hook: {
    reminders: [] as Record<string, unknown>[],
    loading: false,
    error: null as string | null,
    createReminder: vi.fn(),
    updateReminder: vi.fn(),
    dismissReminder: vi.fn(),
    restoreReminder: vi.fn(),
    deleteReminder: vi.fn(),
  },
  useFamily: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('@hooks/useReminders', () => ({ useReminders: () => hook }));
vi.mock('@hooks/useFamily', () => ({ useFamily: useFamily }));
vi.mock('@hooks/useAuth', () => ({ useAuth: useAuth }));

const past = new Date(Date.now() - 3_600_000).toISOString();
const future = new Date(Date.now() + 3_600_000).toISOString();

describe('RemindersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: 'u1' } });
    useFamily.mockReturnValue({
      members: [
        { user_id: 'u1', name: 'Priya', role: 'parent' },
        { user_id: 'u2', name: 'Sam', role: 'child' },
      ],
    });
    hook.reminders = [
      { id: 'd1', title: 'Trash out', scheduled_time: past, is_dismissed: false, user_id: 'u2', recurrence: 'weekly' },
      { id: 'u1r', title: 'Dentist', scheduled_time: future, is_dismissed: false, user_id: 'u1', recurrence: 'once' },
      { id: 'x1', title: 'Old thing', scheduled_time: past, is_dismissed: true, user_id: 'u1', recurrence: 'once' },
    ];
    hook.createReminder.mockResolvedValue({ id: 'new' });
    hook.updateReminder.mockResolvedValue({ id: 'x' });
    hook.dismissReminder.mockResolvedValue(undefined);
    hook.restoreReminder.mockResolvedValue(undefined);
    hook.deleteReminder.mockResolvedValue(undefined);
  });

  it('groups reminders into due / upcoming / dismissed', () => {
    render(<RemindersPage />);

    const due = screen.getByRole('heading', { name: /Due now/ }).closest('section')!;
    expect(within(due).getByText('Trash out')).toBeInTheDocument();
    // recurrence badge
    expect(within(due).getByText('Every week')).toBeInTheDocument();

    const upcoming = screen.getByRole('heading', { name: /Upcoming/ }).closest('section')!;
    expect(within(upcoming).getByText('Dentist')).toBeInTheDocument();

    const dismissed = screen.getByRole('heading', { name: /Done & dismissed/ }).closest('section')!;
    expect(within(dismissed).getByText('Old thing')).toBeInTheDocument();
  });

  it('creates a reminder from the form, defaulting the assignee to the current user', async () => {
    render(<RemindersPage />);

    await userEvent.type(screen.getByLabelText('Title'), 'Water plants');
    const when = screen.getByLabelText('When') as HTMLInputElement;
    await userEvent.type(when, '2026-06-01T09:00');
    await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

    expect(hook.createReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Water plants',
        recurrence: 'once',
        assignee_user_id: 'u1',
      }),
    );
  });

  it('marks a due reminder done', async () => {
    render(<RemindersPage />);

    const due = screen.getByRole('heading', { name: /Due now/ }).closest('section')!;
    await userEvent.click(within(due).getByRole('button', { name: 'Mark done' }));

    expect(hook.dismissReminder).toHaveBeenCalledWith('d1');
  });

  it('restores a dismissed reminder', async () => {
    render(<RemindersPage />);

    const dismissed = screen.getByRole('heading', { name: /Done & dismissed/ }).closest('section')!;
    await userEvent.click(within(dismissed).getByRole('button', { name: 'Restore' }));

    expect(hook.restoreReminder).toHaveBeenCalledWith('x1');
  });
});
