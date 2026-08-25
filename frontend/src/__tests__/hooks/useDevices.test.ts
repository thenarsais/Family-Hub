import { vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDevices } from '@/hooks/useDevices';

vi.mock('@/services/api', () => ({
  apiClient: {
    getSmartThingsDevices: vi.fn(),
    controlSmartThingsDevice: vi.fn(),
  },
}));

import { apiClient } from '@/services/api';

const device1 = { deviceId: 'd1', name: 'Living Room Light', type: 'light' as const, status: { switch: 'off' } };
const device2 = { deviceId: 'd2', name: 'Front Door', type: 'lock' as const, status: { lock: 'locked' } };

describe('useDevices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch devices on mount and clear loading', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      devices: [device1, device2],
    });

    const { result } = renderHook(() => useDevices());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.devices).toEqual([device1, device2]);
    expect(result.current.error).toBeNull();
  });

  it('should default to an empty array when the response has no devices field', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    const { result } = renderHook(() => useDevices());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.devices).toEqual([]);
  });

  it('should set an error and clear devices when the initial fetch fails', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useDevices());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('network down');
    expect(result.current.devices).toEqual([]);
  });

  it('refreshDevices should toggle refreshing and update devices', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ devices: [device1] })
      .mockResolvedValueOnce({ devices: [device1, device2] });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshDevices();
    });

    expect(result.current.devices).toEqual([device1, device2]);
    expect(result.current.refreshing).toBe(false);
  });

  it('refreshDevices should set an error on failure without clearing existing devices', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ devices: [device1] })
      .mockRejectedValueOnce(new Error('refresh failed'));

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refreshDevices();
    });

    expect(result.current.error).toBe('refresh failed');
    expect(result.current.devices).toEqual([device1]);
  });

  it('controlDevice should merge the returned status into local state', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device1] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      status: 'success',
      device: { ...device1, status: { switch: 'on' } },
    });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.controlDevice('d1', 'on');
    });

    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d1', 'on', undefined);
    expect(result.current.devices[0].status).toEqual({ switch: 'on' });
  });

  it('controlDevice should rethrow on failure', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device1] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('command failed'));

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => {
        await result.current.controlDevice('d1', 'on');
      })
    ).rejects.toThrow('command failed');
  });

  it('turnOn should call controlDevice with "on"', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device1] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 'success', device: {} });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.turnOn('d1');
    });

    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d1', 'on', undefined);
  });

  it('turnOff should call controlDevice with "off"', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device1] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 'success', device: {} });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.turnOff('d1');
    });

    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d1', 'off', undefined);
  });

  it('setBrightness should clamp to 0-100', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device1] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'success', device: {} });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.setBrightness('d1', 150);
    });
    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d1', 'setBrightness', [100]);

    await act(async () => {
      await result.current.setBrightness('d1', -10);
    });
    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d1', 'setBrightness', [0]);
  });

  it('setTemperature should pass the value through', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device1] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 'success', device: {} });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.setTemperature('d1', 68);
    });

    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d1', 'setTemperature', [68]);
  });

  it('lock should call controlDevice with "lock"', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device2] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 'success', device: {} });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.lock('d2');
    });

    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d2', 'lock', undefined);
  });

  it('unlock should call controlDevice with "unlock"', async () => {
    (apiClient.getSmartThingsDevices as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ devices: [device2] });
    (apiClient.controlSmartThingsDevice as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ status: 'success', device: {} });

    const { result } = renderHook(() => useDevices());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.unlock('d2');
    });

    expect(apiClient.controlSmartThingsDevice).toHaveBeenCalledWith('d2', 'unlock', undefined);
  });
});
