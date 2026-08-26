import React from 'react';
import { SmartDevice } from '../../hooks/useDevices';
import { Lightbulb, Lock, Thermometer, Power } from 'lucide-react';

interface DeviceCardProps {
  device: SmartDevice;
  onControl: (command: string, args?: any[]) => Promise<void>;
  loading?: boolean;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onControl,
  loading = false,
}) => {
  const getIcon = () => {
    switch (device.type) {
      case 'light':
        return <Lightbulb className="w-6 h-6" />;
      case 'lock':
        return <Lock className="w-6 h-6" />;
      case 'climate':
        return <Thermometer className="w-6 h-6" />;
      case 'switch':
        return <Power className="w-6 h-6" />;
      default:
        return <Power className="w-6 h-6" />;
    }
  };

  const getStatusDisplay = () => {
    switch (device.type) {
      case 'light':
        return `${device.status.switch === 'on' ? '🟢 On' : '⚫ Off'}`;
      case 'lock':
        return device.status.lock === 'locked' ? '🔒 Locked' : '🔓 Unlocked';
      case 'climate':
        return `${device.status.temperature}°F`;
      case 'switch':
        return device.status.switch === 'on' ? '🟢 On' : '⚫ Off';
      default:
        return 'Unknown';
    }
  };

  const handleToggle = async () => {
    if (device.type === 'lock') {
      await onControl(
        device.status.lock === 'locked' ? 'unlock' : 'lock'
      );
    } else if (device.type === 'light' || device.type === 'switch') {
      await onControl(
        device.status.switch === 'on' ? 'off' : 'on'
      );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {device.name}
            </h3>
            {device.room && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {device.room}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
          Status: {getStatusDisplay()}
        </p>
      </div>

      {(device.type === 'light' || device.type === 'switch' || device.type === 'lock') && (
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            device.type === 'lock'
              ? device.status.lock === 'locked'
                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
              : device.status.switch === 'on'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? '...' : device.type === 'lock'
            ? device.status.lock === 'locked'
              ? 'Unlock'
              : 'Lock'
            : device.status.switch === 'on'
            ? 'Turn Off'
            : 'Turn On'}
        </button>
      )}

      {device.type === 'climate' && (
        <div className="space-y-2">
          <input
            type="range"
            min="60"
            max="85"
            value={Number(device.status.temperature) || 72}
            onChange={(e) => onControl('setTemperature', [parseInt(e.target.value)])}
            disabled={loading}
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Set to {Number(device.status.temperature)}°F
          </p>
        </div>
      )}

      {device.type === 'light' && device.status.level !== undefined && (
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="100"
            value={Number(device.status.level) || 100}
            onChange={(e) => onControl('setBrightness', [parseInt(e.target.value)])}
            disabled={loading}
            className="w-full"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Brightness: {Number(device.status.level)}%
          </p>
        </div>
      )}
    </div>
  );
};
