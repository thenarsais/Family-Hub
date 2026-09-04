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
    <div className="bg-raised border border-rule rounded-card shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-paper border border-rule rounded-lg text-ink-2">
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-ink">
              {device.name}
            </h3>
            {device.room && (
              <p className="text-sm text-ink-3">
                {device.room}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-ink-2 font-medium">
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
                ? 'bg-alert/15 text-alert hover:bg-alert/25'
                : 'bg-ok/15 text-ok hover:bg-ok/25'
              : device.status.switch === 'on'
              ? 'bg-accent-soft text-accent-strong hover:bg-accent/20'
              : 'bg-paper border border-rule text-ink-2 hover:bg-accent-soft'
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
          <p className="text-xs text-ink-3 text-center">
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
          <p className="text-xs text-ink-3 text-center">
            Brightness: {Number(device.status.level)}%
          </p>
        </div>
      )}
    </div>
  );
};
