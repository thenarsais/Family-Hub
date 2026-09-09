import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PinPad from '@/components/kiosk/PinPad';

const type = async (digits: string) => {
  for (const d of digits) {
    await userEvent.click(screen.getByRole('button', { name: d }));
  }
};

beforeEach(() => vi.clearAllMocks());

describe('PinPad', () => {
  it('auto-submits once four digits are entered', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PinPad onSubmit={onSubmit} onCancel={vi.fn()} />);

    await type('123');
    expect(onSubmit).not.toHaveBeenCalled();
    await type('4');
    expect(onSubmit).toHaveBeenCalledWith('1234');
  });

  it('shows a retry message and clears on a rejected PIN', async () => {
    const onSubmit = vi.fn().mockRejectedValue({ response: { status: 401 } });
    render(<PinPad onSubmit={onSubmit} onCancel={vi.fn()} />);

    await type('0000');
    expect(await screen.findByText(/didn.t work/i)).toBeInTheDocument();
    // dots reset — a fresh 4 digits submits again
    await type('1234');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });

  it('shows a rate-limit message on 429', async () => {
    const onSubmit = vi.fn().mockRejectedValue({ response: { status: 429 } });
    render(<PinPad onSubmit={onSubmit} onCancel={vi.fn()} />);
    await type('0000');
    expect(await screen.findByText(/too many/i)).toBeInTheDocument();
  });

  it('backspace removes the last digit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PinPad onSubmit={onSubmit} onCancel={vi.fn()} />);
    await type('12');
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    await type('34'); // now 1,3,4 → still only 3 digits
    expect(onSubmit).not.toHaveBeenCalled();
    await type('5');
    expect(onSubmit).toHaveBeenCalledWith('1345');
  });

  it('cancel calls onCancel', async () => {
    const onCancel = vi.fn();
    render(<PinPad onSubmit={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
