import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export interface SmartDevice {
  deviceId: string;
  name: string;
  type: 'light' | 'lock' | 'climate' | 'switch' | 'sensor' | 'other';
  room?: string;
  status: Record<string, any>;
}

export function useDevices() {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getSmartThingsDevices();
      setDevices(response.devices || []);
    } catch (err: any) {
      console.error('Failed to fetch devices:', err);
      setError(err.message || 'Failed to load devices');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await apiClient.getSmartThingsDevices();
      setDevices(response.devices || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to refresh devices:', err);
      setError(err.message || 'Failed to refresh devices');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const controlDevice = useCallback(
    async (deviceId: string, command: string, args?: any[]) => {
      try {
        const response = await apiClient.controlSmartThingsDevice(
          deviceId,
          command,
          args
        );

        // Update local state optimistically. The control endpoint's
        // top-level `status` is a 'success'/'failed' string, not the
        // device's own status object -- that lives at `response.device.status`.
        setDevices(
          devices.map(d =>
            d.deviceId === deviceId
              ? { ...d, status: { ...d.status, ...response.device?.status } }
              : d
          )
        );

        return response;
      } catch (err: any) {
        console.error(`Failed to control device ${deviceId}:`, err);
        throw err;
      }
    },
    [devices]
  );

  const turnOn = useCallback(
    async (deviceId: string) => {
      return controlDevice(deviceId, 'on');
    },
    [controlDevice]
  );

  const turnOff = useCallback(
    async (deviceId: string) => {
      return controlDevice(deviceId, 'off');
    },
    [controlDevice]
  );

  const setBrightness = useCallback(
    async (deviceId: string, level: number) => {
      return controlDevice(deviceId, 'setBrightness', [
        Math.min(100, Math.max(0, level)),
      ]);
    },
    [controlDevice]
  );

  const setTemperature = useCallback(
    async (deviceId: string, temp: number) => {
      return controlDevice(deviceId, 'setTemperature', [temp]);
    },
    [controlDevice]
  );

  const lock = useCallback(
    async (deviceId: string) => {
      return controlDevice(deviceId, 'lock');
    },
    [controlDevice]
  );

  const unlock = useCallback(
    async (deviceId: string) => {
      return controlDevice(deviceId, 'unlock');
    },
    [controlDevice]
  );

  // Fetch devices on mount
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    devices,
    loading,
    error,
    refreshing,
    refreshDevices,
    controlDevice,
    turnOn,
    turnOff,
    setBrightness,
    setTemperature,
    lock,
    unlock,
  };
}
