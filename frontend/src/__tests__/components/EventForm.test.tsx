import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventForm } from '@/components/Calendar/EventForm';

function setup(props: Partial<Parameters<typeof EventForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <EventForm mode="create" onSubmit={onSubmit} onClose={onClose} {...props} />,
  );
  return { onSubmit, onClose };
}

describe('EventForm', () => {
  afterEach(() => vi.clearAllMocks());

  it('requires a title', () => {
    const { onSubmit } = setup();
    fireEvent.submit(screen.getByRole('button', { name: /create event/i }).closest('form')!);
    expect(screen.getByText(/give the event a title/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a timed event with the browser timezone and date/time parts', async () => {
    const { onSubmit, onClose } = setup();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Dentist' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '14:00' } });
    fireEvent.submit(screen.getByRole('button', { name: /create event/i }).closest('form')!);

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const values = onSubmit.mock.calls[0][0];
    expect(values).toMatchObject({
      summary: 'Dentist', allDay: false, startDate: '2026-09-10', startTime: '14:00',
    });
    expect(typeof values.timeZone).toBe('string');
    expect(values.timeZone.length).toBeGreaterThan(0);
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('hides the time fields for an all-day event and omits times', async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Trip' } });
    fireEvent.click(screen.getByLabelText('All day'));
    expect(screen.queryByLabelText('Start time')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-09-30' } });
    fireEvent.submit(screen.getByRole('button', { name: /create event/i }).closest('form')!);

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const values = onSubmit.mock.calls[0][0];
    expect(values.allDay).toBe(true);
    expect(values.startTime).toBeUndefined();
    expect(values.endTime).toBeUndefined();
  });

  it('adds attendee chips and rejects a malformed email', () => {
    setup();
    const input = screen.getByLabelText('Attendees');

    fireEvent.change(input, { target: { value: 'mom@example.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('mom@example.com')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText(/not a valid email address/i)).toBeInTheDocument();
  });

  it('rejects an end date before the start date', () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Bad range' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2026-09-01' } });
    fireEvent.submit(screen.getByRole('button', { name: /create event/i }).closest('form')!);

    expect(screen.getByText(/end date is before the start date/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('pre-fills from an initial event in edit mode', () => {
    setup({
      mode: 'edit',
      initial: {
        google_event_id: 'g-1', summary: 'Existing', location: 'Room B',
        allDay: false, startDate: '2026-09-10', startTime: '09:30',
        attendees: ['a@x.com'],
      },
    });

    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Existing');
    expect((screen.getByLabelText('Location') as HTMLInputElement).value).toBe('Room B');
    expect(screen.getByText('a@x.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('shows a submit error and keeps the form open when onSubmit rejects', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Google said no'));
    render(<EventForm mode="create" onSubmit={onSubmit} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'X' } });
    fireEvent.submit(screen.getByRole('button', { name: /create event/i }).closest('form')!);

    await vi.waitFor(() => expect(screen.getByText('Google said no')).toBeInTheDocument());
  });
});
