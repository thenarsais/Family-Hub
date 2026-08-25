import { vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartHome } from '@/components/SmartHome/SmartHome';
import * as deviceHook from '@/hooks/useDevices';

vi.mock('@/hooks/useDevices');

const lightDevice = {
  deviceId: 'light-1',
  name: 'Living Room Light',
  type: 'light' as const,
  room: 'Living Room',
  status: { switch: 'off' },
};

describe('SmartHome — device control end to end', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call controlDevice with the device id when a card toggle is clicked', async () => {
    const controlDevice = vi.fn().mockResolvedValue(undefined);
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [lightDevice],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice,
    });

    const user = userEvent.setup();
    render(<SmartHome />);

    await user.click(screen.getByRole('button', { name: /turn on/i }));

    expect(controlDevice).toHaveBeenCalledWith('light-1', 'on', undefined);
  });

  it('should mark only the controlled device as loading while its command is in flight', async () => {
    let resolveControl: () => void = () => {};
    const controlDevice = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveControl = resolve;
        })
    );
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [lightDevice],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice,
    });

    const user = userEvent.setup();
    render(<SmartHome />);

    const toggleButton = screen.getByRole('button', { name: /turn on/i });
    await user.click(toggleButton);

    await waitFor(() => expect(screen.getByRole('button', { name: '...' })).toBeDisabled());

    resolveControl();
    await waitFor(() => expect(screen.getByRole('button', { name: /turn on/i })).not.toBeDisabled());
  });

  it('should log and clear the loading state when controlDevice rejects', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const controlDevice = vi.fn().mockRejectedValue(new Error('command failed'));
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [lightDevice],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice,
    });

    const user = userEvent.setup();
    render(<SmartHome />);

    await user.click(screen.getByRole('button', { name: /turn on/i }));

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Control failed:', expect.any(Error)));
    expect(screen.getByRole('button', { name: /turn on/i })).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });

  it('should disable the refresh button while refreshing', () => {
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [lightDevice],
      loading: false,
      error: null,
      refreshing: true,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled();
  });

  it('should call refreshDevices from the empty-state "Refresh Devices" button', async () => {
    const refreshDevices = vi.fn();
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices,
      controlDevice: vi.fn(),
    });

    const user = userEvent.setup();
    render(<SmartHome />);

    await user.click(screen.getByRole('button', { name: /refresh devices/i }));

    expect(refreshDevices).toHaveBeenCalled();
  });
});
