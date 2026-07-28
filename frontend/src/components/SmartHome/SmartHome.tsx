import React, { useState } from 'react';
import { useDevices } from '../../hooks/useDevices';
import { DeviceCard } from './DeviceCard';
import { RefreshCw, AlertCircle, Wifi } from 'lucide-react';

export const SmartHome: React.FC = () => {
  const {
    devices,
    loading,
    error,
    refreshing,
    refreshDevices,
    controlDevice,
  } = useDevices();

  const [controllingDeviceId, setControllingDeviceId] = useState<string | null>(null);

  const handleDeviceControl = async (deviceId: string, command: string, args?: any[]) => {
    setControllingDeviceId(deviceId);
    try {
      await controlDevice(deviceId, command, args);
    } catch (err) {
      console.error('Control failed:', err);
    } finally {
      setControllingDeviceId(null);
    }
  };

  const devicesByRoom = devices.reduce(
    (acc, device) => {
      const room = device.room || 'Other';
      if (!acc[room]) acc[room] = [];
      acc[room].push(device);
      return acc;
    },
    {} as Record<string, typeof devices>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Wifi className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Smart Home
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {devices.length} device{devices.length !== 1 ? 's' : ''} connected
              </p>
            </div>
          </div>
          <button
            onClick={refreshDevices}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Error Loading Devices
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading devices...</p>
            </div>
          </div>
        )}

        {/* Devices Grid */}
        {!loading && devices.length > 0 && (
          <div className="space-y-8">
            {Object.entries(devicesByRoom).map(([room, roomDevices]) => (
              <div key={room}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {room}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {roomDevices.map((device) => (
                    <DeviceCard
                      key={device.deviceId}
                      device={device}
                      onControl={(command, args) =>
                        handleDeviceControl(device.deviceId, command, args)
                      }
                      loading={controllingDeviceId === device.deviceId}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && devices.length === 0 && !error && (
          <div className="text-center py-12">
            <Wifi className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
              No Devices Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Connect your SmartThings devices to get started
            </p>
            <button
              onClick={refreshDevices}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Refresh Devices
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartHome;
