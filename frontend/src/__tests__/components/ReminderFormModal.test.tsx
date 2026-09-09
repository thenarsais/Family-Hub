import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReminderFormModal from '@/components/ReminderFormModal';

const members = [
  { user_id: 'u1', name: 'Priya', role: 'parent' },
  { user_id: 'u2', name: 'Sam', role: 'child' },
] as never;

function setup(onSubmit = vi.fn<(p: unknown) => Promise<unknown>>().mockResolvedValue({ id: 'r' })) {
  const onClose = vi.fn();
  render(
    <ReminderFormModal
      members={members}
      defaultAssigneeId="u1"
      onSubmit={onSubmit}
      onClose={onClose}
    />,
  );
  return { onSubmit, onClose };
}

beforeEach(() => vi.clearAllMocks());

describe('ReminderFormModal', () => {
  it('renders a labelled dialog with the reminder form', () => {
    setup();
    expect(screen.getByRole('dialog', { name: /new reminder/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('When')).toBeInTheDocument();
  });

  it('closes on the ✕ button and on a backdrop click', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('dialog', { name: /new reminder/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('does not close on a click inside the panel', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByLabelText('Title'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submits the form and then closes', async () => {
    const { onSubmit, onClose } = setup();
    await userEvent.type(screen.getByLabelText('Title'), 'Pay rent');
    await userEvent.type(screen.getByLabelText('When'), '2026-06-01T09:00');
    await userEvent.click(screen.getByRole('button', { name: /add reminder/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Pay rent' }));
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
