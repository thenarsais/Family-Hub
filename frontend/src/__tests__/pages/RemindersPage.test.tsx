import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RemindersPage, {
  isoToLocalInput,
  localInputToIso,
  whenLabel,
} from '@/pages/RemindersPage';

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
vi.mock('@hooks/useFamily', () => ({ useFamily }));
vi.mock('@hooks/useAuth', () => ({ useAuth }));

const past = new Date(Date.now() - 3_600_000).toISOString();
const future = new Date(Date.now() + 3_600_000).toISOString();

function baseReminders() {
  return [
    { id: 'd1', title: 'Trash out', scheduled_time: past, is_dismissed: false, user_id: 'u2', recurrence: 'weekly' },
    { id: 'u1r', title: 'Dentist', scheduled_time: future, is_dismissed: false, user_id: 'u1', recurrence: 'once' },
    { id: 'x1', title: 'Old thing', scheduled_time: past, is_dismissed: true, user_id: 'u1', recurrence: 'once', description: 'note' },
  ];
}

describe('RemindersPage helpers', () => {
  it('isoToLocalInput handles empty and invalid input', () => {
    expect(isoToLocalInput()).toBe('');
    expect(isoToLocalInput(null)).toBe('');
    expect(isoToLocalInput('not-a-date')).toBe('');
    expect(isoToLocalInput('2026-06-01T09:05:00Z')).toMatch(/^2026-06-01T\d\d:\d\d$/);
  });

  it('localInputToIso handles empty and invalid input', () => {
    expect(localInputToIso('')).toBeNull();
    expect(localInputToIso('nonsense')).toBeNull();
    expect(localInputToIso('2026-06-01T09:00')).toBe(new Date('2026-06-01T09:00').toISOString());
  });

  it('whenLabel handles empty and invalid input', () => {
    expect(whenLabel()).toBe('');
    expect(whenLabel('bad')).toBe('');
    expect(whenLabel('2026-06-01T09:00:00Z')).not.toBe('');
  });
});

describe('RemindersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: { id: 'u1' } });
    useFamily.mockReturnValue({
      members: [
        { user_id: 'u1', name: 'Priya', role: 'parent' },
        { user_id: 'u2', name: 'Sam', role: 'child' },
        { user_id: 'u3', name: null, role: 'child' },
      ],
    });
    hook.reminders = baseReminders();
    hook.loading = false;
    hook.error = null;
    hook.createReminder.mockResolvedValue({ id: 'new' });
    hook.updateReminder.mockResolvedValue({ id: 'x' });
    hook.dismissReminder.mockResolvedValue(undefined);
    hook.restoreReminder.mockResolvedValue(undefined);
    hook.deleteReminder.mockResolvedValue(undefined);
  });

  it('shows a loading spinner while loading', () => {
    hook.loading = true;
    const { container } = render(<RemindersPage />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows an error banner but still renders the list sections when the hook errors', () => {
    hook.error = 'kaboom';
    hook.reminders = [];
    render(<RemindersPage />);
    expect(screen.getByText(/Couldn't load your reminders: kaboom/)).toBeInTheDocument();
    // the section headers still render so the page reads as a list page, not just a form
    expect(screen.getByRole('heading', { name: /Due now/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Upcoming/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Done & dismissed/ })).toBeInTheDocument();
    expect(screen.getByText('Nothing due right now.')).toBeInTheDocument();
  });

  it('groups reminders into due / upcoming / dismissed', () => {
    render(<RemindersPage />);

    const due = screen.getByRole('heading', { name: /Due now/ }).closest('section')!;
    expect(within(due).getByText('Trash out')).toBeInTheDocument();
    expect(within(due).getByText('Every week')).toBeInTheDocument();
    expect(within(due).getByText('Sam')).toBeInTheDocument();

    const upcoming = screen.getByRole('heading', { name: /Upcoming/ }).closest('section')!;
    expect(within(upcoming).getByText('Dentist')).toBeInTheDocument();

    const dismissed = screen.getByRole('heading', { name: /Done & dismissed/ }).closest('section')!;
    expect(within(dismissed).getByText('Old thing')).toBeInTheDocument();
    expect(within(dismissed).getByText('note')).toBeInTheDocument();
  });

  it('renders empty-state copy for empty groups', () => {
    hook.reminders = [];
    render(<RemindersPage />);
    expect(screen.getByText('Nothing due right now.')).toBeInTheDocument();
    expect(screen.getByText('No upcoming reminders.')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });

  describe('create form', () => {
    it('validates the title', async () => {
      render(<RemindersPage />);
      await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
      expect(screen.getByText('Give the reminder a title.')).toBeInTheDocument();
      expect(hook.createReminder).not.toHaveBeenCalled();
    });

    it('validates the date/time', async () => {
      render(<RemindersPage />);
      await userEvent.type(screen.getByLabelText('Title'), 'Water plants');
      await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
      expect(screen.getByText('Pick a date and time.')).toBeInTheDocument();
      expect(hook.createReminder).not.toHaveBeenCalled();
    });

    it('creates a one-off reminder, defaulting the assignee to the current user', async () => {
      render(<RemindersPage />);
      await userEvent.type(screen.getByLabelText('Title'), 'Water plants');
      await userEvent.type(screen.getByLabelText('When'), '2026-06-01T09:00');
      await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

      expect(hook.createReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Water plants',
          recurrence: 'once',
          recurrence_end_date: null,
          assignee_user_id: 'u1',
        }),
      );
    });

    it('reveals the "Until" field for a repeat and passes the end date + chosen assignee', async () => {
      render(<RemindersPage />);
      await userEvent.type(screen.getByLabelText('Title'), 'Bins');
      await userEvent.type(screen.getByLabelText('When'), '2026-06-01T07:00');
      await userEvent.selectOptions(screen.getByLabelText('Repeat'), 'weekly');
      await userEvent.type(screen.getByLabelText(/Until/), '2026-12-31');
      await userEvent.selectOptions(screen.getByLabelText('For'), 'u2');
      await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

      expect(hook.createReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Bins',
          recurrence: 'weekly',
          recurrence_end_date: '2026-12-31',
          assignee_user_id: 'u2',
        }),
      );
    });

    it('surfaces a create failure', async () => {
      hook.createReminder.mockRejectedValueOnce(new Error('server said no'));
      render(<RemindersPage />);
      await userEvent.type(screen.getByLabelText('Title'), 'X');
      await userEvent.type(screen.getByLabelText('When'), '2026-06-01T09:00');
      await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

      expect(await screen.findByText('server said no')).toBeInTheDocument();
    });

    it('falls back to a generic message for a non-Error rejection', async () => {
      hook.createReminder.mockRejectedValueOnce('boom');
      render(<RemindersPage />);
      await userEvent.type(screen.getByLabelText('Title'), 'X');
      await userEvent.type(screen.getByLabelText('When'), '2026-06-01T09:00');
      await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

      expect(await screen.findByText('Could not create the reminder.')).toBeInTheDocument();
    });

    it('labels the current user as "(me)" and falls back for a nameless member', () => {
      render(<RemindersPage />);
      const opts = within(screen.getByLabelText('For')).getAllByRole('option');
      expect(opts.map((o) => o.textContent)).toEqual(['Priya (me)', 'Sam', 'Family member']);
    });
  });

  describe('row actions', () => {
    it('edits a reminder inline', async () => {
      render(<RemindersPage />);
      const upcoming = screen.getByRole('heading', { name: /Upcoming/ }).closest('section')!;

      await userEvent.click(within(upcoming).getByRole('button', { name: 'Edit' }));
      const titleBox = within(upcoming).getByDisplayValue('Dentist');
      await userEvent.clear(titleBox);
      await userEvent.type(titleBox, 'Dentist 2pm');
      await userEvent.click(within(upcoming).getByRole('button', { name: 'Save' }));

      expect(hook.updateReminder).toHaveBeenCalledWith(
        'u1r',
        expect.objectContaining({ title: 'Dentist 2pm', recurrence: 'once' }),
      );
    });

    it('does not save an edit with an empty title', async () => {
      render(<RemindersPage />);
      const upcoming = screen.getByRole('heading', { name: /Upcoming/ }).closest('section')!;

      await userEvent.click(within(upcoming).getByRole('button', { name: 'Edit' }));
      await userEvent.clear(within(upcoming).getByDisplayValue('Dentist'));
      await userEvent.click(within(upcoming).getByRole('button', { name: 'Save' }));

      expect(hook.updateReminder).not.toHaveBeenCalled();
    });

    it('logs but stays open when a save fails', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      hook.updateReminder.mockRejectedValueOnce(new Error('save failed'));
      render(<RemindersPage />);
      const upcoming = screen.getByRole('heading', { name: /Upcoming/ }).closest('section')!;

      await userEvent.click(within(upcoming).getByRole('button', { name: 'Edit' }));
      await userEvent.click(within(upcoming).getByRole('button', { name: 'Save' }));

      await vi.waitFor(() => expect(err).toHaveBeenCalledWith('Failed to save reminder:', expect.any(Error)));
      err.mockRestore();
    });

    it('logs when a done / restore call rejects', async () => {
      const err = vi.spyOn(console, 'error').mockImplementation(() => {});
      hook.dismissReminder.mockRejectedValueOnce(new Error('x'));
      hook.restoreReminder.mockRejectedValueOnce(new Error('y'));
      render(<RemindersPage />);

      const due = screen.getByRole('heading', { name: /Due now/ }).closest('section')!;
      await userEvent.click(within(due).getByRole('button', { name: 'Mark done' }));
      const dismissed = screen.getByRole('heading', { name: /Done & dismissed/ }).closest('section')!;
      await userEvent.click(within(dismissed).getByRole('button', { name: 'Restore' }));

      await vi.waitFor(() => {
        expect(err).toHaveBeenCalledWith('Failed to dismiss reminder:', expect.any(Error));
        expect(err).toHaveBeenCalledWith('Failed to restore reminder:', expect.any(Error));
      });
      err.mockRestore();
    });

    it('cancels an inline edit', async () => {
      render(<RemindersPage />);
      const upcoming = screen.getByRole('heading', { name: /Upcoming/ }).closest('section')!;

      await userEvent.click(within(upcoming).getByRole('button', { name: 'Edit' }));
      await userEvent.click(within(upcoming).getByRole('button', { name: 'Cancel' }));

      expect(within(upcoming).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
      expect(within(upcoming).getByText('Dentist')).toBeInTheDocument();
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

    it('deletes only after confirmation', async () => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
      render(<RemindersPage />);
      const due = screen.getByRole('heading', { name: /Due now/ }).closest('section')!;

      await userEvent.click(within(due).getByRole('button', { name: 'Delete' }));
      expect(hook.deleteReminder).not.toHaveBeenCalled();

      await userEvent.click(within(due).getByRole('button', { name: 'Delete' }));
      expect(hook.deleteReminder).toHaveBeenCalledWith('d1');

      confirm.mockRestore();
    });
  });
});
