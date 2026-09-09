import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KioskSettings from '@/components/kiosk/KioskSettings';

const { mockUseKiosk } = vi.hoisted(() => ({ mockUseKiosk: vi.fn() }));
vi.mock('@hooks/useKiosk', () => ({ useKiosk: mockUseKiosk }));
vi.mock('@/services/api', () => ({
  apiClient: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import { apiClient } from '@/services/api';

const get = apiClient.get as ReturnType<typeof vi.fn>;
const put = apiClient.put as ReturnType<typeof vi.fn>;
const del = apiClient.delete as ReturnType<typeof vi.fn>;

const fns = { enroll: vi.fn().mockResolvedValue(undefined), leaveKiosk: vi.fn() };

function withKiosk(isKiosk = false) {
  mockUseKiosk.mockReturnValue({ isKiosk, ...fns });
}

beforeEach(() => {
  vi.clearAllMocks();
  get.mockResolvedValue({ data: { devices: [] } });
});

const props = {
  hasPin: false,
  idleMinutes: 5,
  onChangeIdle: vi.fn(),
  onPinChanged: vi.fn(),
};

describe('KioskSettings', () => {
  it('offers to enrol this device when not in kiosk mode', async () => {
    withKiosk(false);
    render(<KioskSettings {...props} />);
    expect(
      screen.getByRole('button', { name: /use this device as the family display/i }),
    ).toBeInTheDocument();
    await waitFor(() => expect(get).toHaveBeenCalledWith('/api/kiosk/devices'));
  });

  it('offers to stop when already a display', () => {
    withKiosk(true);
    render(<KioskSettings {...props} />);
    expect(screen.getByRole('button', { name: /stop using this device/i })).toBeInTheDocument();
  });

  it('sets a PIN', async () => {
    withKiosk(false);
    put.mockResolvedValueOnce({ data: {} });
    render(<KioskSettings {...props} />);

    await userEvent.click(screen.getByRole('button', { name: /set a pin/i }));
    await userEvent.type(screen.getByLabelText(/new 4-digit pin/i), '1234');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(put).toHaveBeenCalledWith('/api/kiosk/pin', { pin: '1234' });
    expect(props.onPinChanged).toHaveBeenCalled();
  });

  it('rejects a short PIN before calling the API', async () => {
    withKiosk(false);
    render(<KioskSettings {...props} />);
    await userEvent.click(screen.getByRole('button', { name: /set a pin/i }));
    await userEvent.type(screen.getByLabelText(/new 4-digit pin/i), '12');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(put).not.toHaveBeenCalled();
    expect(screen.getByText(/must be 4 digits/i)).toBeInTheDocument();
  });

  it('removes an existing PIN', async () => {
    withKiosk(false);
    del.mockResolvedValueOnce({ data: {} });
    render(<KioskSettings {...props} hasPin />);
    await userEvent.click(screen.getByRole('button', { name: /remove pin/i }));
    expect(del).toHaveBeenCalledWith('/api/kiosk/pin');
    expect(props.onPinChanged).toHaveBeenCalled();
  });

  it('commits a changed idle timeout on blur', async () => {
    withKiosk(false);
    render(<KioskSettings {...props} />);
    const input = screen.getByLabelText(/idle minutes/i);
    await userEvent.clear(input);
    await userEvent.type(input, '2');
    input.blur();
    expect(props.onChangeIdle).toHaveBeenCalledWith(2);
  });

  it('lists registered displays and revokes one', async () => {
    withKiosk(false);
    get.mockResolvedValue({
      data: { devices: [{ id: 'd1', label: 'Kitchen', lastSeenAt: null, createdAt: '2026-09-09' }] },
    });
    del.mockResolvedValue({ data: {} });
    render(<KioskSettings {...props} />);

    expect(await screen.findByText('Kitchen')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /revoke kitchen/i }));
    expect(del).toHaveBeenCalledWith('/api/kiosk/devices/d1');
  });
});
