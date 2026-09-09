import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventReminderDialog from '@/components/Calendar/EventReminderDialog';

const START = new Date('2026-06-01T15:00:00Z'); // a timed event

function setup(over: Parameters<typeof buildProps>[0] = {}) {
  const props = buildProps(over);
  render(<EventReminderDialog {...props} />);
  return props;
}

function buildProps(over: {
  allDay?: boolean;
  seriesCadence?: 'daily' | 'weekly' | 'monthly' | null;
  recurringEventId?: string | null;
  existing?: unknown[];
} = {}) {
  return {
    event: { id: 'evt-1', title: 'Soccer practice', recurringEventId: over.recurringEventId ?? null },
    startAt: START,
    allDay: over.allDay ?? false,
    seriesCadence: over.seriesCadence ?? null,
    existing: (over.existing ?? []) as never,
    onCreate: vi.fn().mockResolvedValue({ id: 'r' }),
    onDelete: vi.fn().mockResolvedValue(undefined),
    onClose: vi.fn(),
  };
}

beforeEach(() => vi.clearAllMocks());

describe('EventReminderDialog', () => {
  it('shows the 6 timed presets + a custom row for a timed event', () => {
    setup();
    ['At the event', '10 minutes before', '30 minutes before', '1 hour before', '1 day before', '2 days before'].forEach(
      (l) => expect(screen.getByLabelText(l)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Custom lead time value')).toBeInTheDocument();
  });

  it('shows only the 9am option set (no custom row) for an all-day event', () => {
    setup({ allDay: true });
    expect(screen.getByLabelText(/morning of \(9am\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/1 week before/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Custom lead time value')).not.toBeInTheDocument();
  });

  it('pre-checks the boxes for existing linked reminders', () => {
    setup({
      existing: [
        { id: 'r1', related_item_id: 'evt-1', related_item_type: 'calendar_event', remind_before_minutes: 60 },
      ],
    });
    expect(screen.getByLabelText('1 hour before')).toBeChecked();
    expect(screen.getByLabelText('At the event')).not.toBeChecked();
  });

  it('creates a reminder for a newly checked lead time at start − offset', async () => {
    const { onCreate, onClose } = setup();
    await userEvent.click(screen.getByLabelText('1 hour before'));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Soccer practice',
        reminder_type: 'event',
        related_item_id: 'evt-1',
        related_item_type: 'calendar_event',
        remind_before_minutes: 60,
        recurrence: 'once',
        scheduled_time: new Date(START.getTime() - 60 * 60_000).toISOString(),
      }),
    );
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('deletes an existing reminder that gets unchecked', async () => {
    const { onDelete } = setup({
      existing: [
        { id: 'r1', related_item_id: 'evt-1', related_item_type: 'calendar_event', remind_before_minutes: 60 },
      ],
    });
    await userEvent.click(screen.getByLabelText('1 hour before')); // uncheck
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('adds a custom lead time and includes it on save', async () => {
    const { onCreate } = setup();
    fireEvent.change(screen.getByLabelText('Custom lead time value'), { target: { value: '2' } });
    await userEvent.selectOptions(screen.getByLabelText('Custom lead time unit'), 'hours');
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ remind_before_minutes: 120 }),
    );
  });

  it('offers the scope radio for a recurring event and creates a recurring reminder', async () => {
    const { onCreate } = setup({ recurringEventId: 'series-1', seriesCadence: 'weekly' });
    expect(screen.getByText(/every event in the series/i)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/every event in the series/i));
    expect(screen.getByText(/repeats ~weekly/i)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('1 day before'));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ related_item_id: 'series-1', recurrence: 'weekly' }),
    );
  });

  it('closes on Cancel and on a backdrop click', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('dialog', { name: /reminders for soccer practice/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders a non-preset existing lead time as its own checked row', () => {
    setup({
      existing: [
        { id: 'r1', related_item_id: 'evt-1', related_item_type: 'calendar_event', remind_before_minutes: 45 },
      ],
    });
    expect(screen.getByLabelText('45 minutes before')).toBeChecked();
  });

  it('makes no calls when nothing changed', async () => {
    const { onCreate, onDelete, onClose } = setup({
      existing: [
        { id: 'r1', related_item_id: 'evt-1', related_item_type: 'calendar_event', remind_before_minutes: 60 },
      ],
    });
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onCreate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('surfaces an error and stays open when a create fails', async () => {
    const props = buildProps();
    props.onCreate = vi.fn().mockRejectedValueOnce(new Error('server said no'));
    render(<EventReminderDialog {...props} />);

    await userEvent.click(screen.getByLabelText('1 hour before'));
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));

    expect(await screen.findByText('server said no')).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('adding a custom value that equals a preset just checks that preset', async () => {
    const { onCreate } = setup();
    fireEvent.change(screen.getByLabelText('Custom lead time value'), { target: { value: '60' } });
    // unit defaults to minutes → 60 == "1 hour before" preset
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));
    expect(screen.getByLabelText('1 hour before')).toBeChecked();
    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ remind_before_minutes: 60 }));
  });
});
