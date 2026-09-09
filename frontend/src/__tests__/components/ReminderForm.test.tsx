import { vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReminderForm from '@/components/ReminderForm';

const members = [
  { user_id: 'u1', name: 'Priya', role: 'parent' },
  { user_id: 'u2', name: 'Sam', role: 'child' },
  { user_id: 'u3', name: null, role: 'child' },
] as never;

function setup(onSubmit = vi.fn<(p: unknown) => Promise<unknown>>().mockResolvedValue({ id: 'new' })) {
  const onSuccess = vi.fn();
  render(
    <ReminderForm members={members} defaultAssigneeId="u1" onSubmit={onSubmit} onSuccess={onSuccess} />,
  );
  return { onSubmit, onSuccess };
}

beforeEach(() => vi.clearAllMocks());

describe('ReminderForm', () => {
  it('validates the title', async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
    expect(screen.getByText('Give the reminder a title.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates the date/time', async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText('Title'), 'Water plants');
    await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
    expect(screen.getByText('Pick a date and time.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('creates a one-off reminder, defaulting the assignee to the current user, then fires onSuccess', async () => {
    const { onSubmit, onSuccess } = setup();
    await userEvent.type(screen.getByLabelText('Title'), 'Water plants');
    await userEvent.type(screen.getByLabelText('When'), '2026-06-01T09:00');
    await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Water plants',
        recurrence: 'once',
        recurrence_end_date: null,
        assignee_user_id: 'u1',
      }),
    );
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('reveals "Until" for a repeat and passes the end date + chosen assignee', async () => {
    const { onSubmit } = setup();
    await userEvent.type(screen.getByLabelText('Title'), 'Bins');
    await userEvent.type(screen.getByLabelText('When'), '2026-06-01T07:00');
    await userEvent.selectOptions(screen.getByLabelText('Repeat'), 'weekly');
    await userEvent.type(screen.getByLabelText(/Until/), '2026-12-31');
    await userEvent.selectOptions(screen.getByLabelText('For'), 'u2');
    await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bins',
        recurrence: 'weekly',
        recurrence_end_date: '2026-12-31',
        assignee_user_id: 'u2',
      }),
    );
  });

  it('surfaces a create failure and does not fire onSuccess', async () => {
    const onSubmit = vi.fn<(p: unknown) => Promise<unknown>>().mockRejectedValueOnce(
      new Error('server said no'),
    );
    const { onSuccess } = setup(onSubmit);
    await userEvent.type(screen.getByLabelText('Title'), 'X');
    await userEvent.type(screen.getByLabelText('When'), '2026-06-01T09:00');
    await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

    expect(await screen.findByText('server said no')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error rejection', async () => {
    const onSubmit = vi.fn<(p: unknown) => Promise<unknown>>().mockRejectedValueOnce('boom');
    setup(onSubmit);
    await userEvent.type(screen.getByLabelText('Title'), 'X');
    await userEvent.type(screen.getByLabelText('When'), '2026-06-01T09:00');
    await userEvent.click(screen.getByRole('button', { name: /Add reminder/ }));

    expect(await screen.findByText('Could not create the reminder.')).toBeInTheDocument();
  });

  it('labels the default assignee as "(me)" and falls back for a nameless member', () => {
    setup();
    const opts = within(screen.getByLabelText('For')).getAllByRole('option');
    expect(opts.map((o) => o.textContent)).toEqual(['Priya (me)', 'Sam', 'Family member']);
  });
});
