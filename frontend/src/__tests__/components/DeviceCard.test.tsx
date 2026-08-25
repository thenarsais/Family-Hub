import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeviceCard } from '@/components/SmartHome/DeviceCard';
import type { SmartDevice } from '@/hooks/useDevices';

function makeDevice(overrides: Partial<SmartDevice> = {}): SmartDevice {
  return {
    deviceId: 'd1',
    name: 'Living Room Light',
    type: 'light',
    status: {},
    ...overrides,
  } as SmartDevice;
}

describe('DeviceCard', () => {
  it('should render the device name and room when present', () => {
    render(<DeviceCard device={makeDevice({ room: 'Living Room' })} onControl={vi.fn()} />);

    expect(screen.getByText('Living Room Light')).toBeInTheDocument();
    expect(screen.getByText('Living Room')).toBeInTheDocument();
  });

  it('should not render a room line when the device has none', () => {
    const { container } = render(<DeviceCard device={makeDevice()} onControl={vi.fn()} />);

    expect(container.querySelectorAll('p').length).toBeLessThan(3);
  });

  describe('status display and toggle by device type', () => {
    it('light: shows on/off status and toggles', async () => {
      const onControl = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<DeviceCard device={makeDevice({ type: 'light', status: { switch: 'off' } })} onControl={onControl} />);

      expect(screen.getByText(/off/i)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /turn on/i }));

      expect(onControl).toHaveBeenCalledWith('on');
    });

    it('light: turns off when currently on', async () => {
      const onControl = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<DeviceCard device={makeDevice({ type: 'light', status: { switch: 'on' } })} onControl={onControl} />);

      await user.click(screen.getByRole('button', { name: /turn off/i }));

      expect(onControl).toHaveBeenCalledWith('off');
    });

    it('switch: behaves the same as light for toggling', async () => {
      const onControl = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<DeviceCard device={makeDevice({ type: 'switch', status: { switch: 'off' } })} onControl={onControl} />);

      await user.click(screen.getByRole('button', { name: /turn on/i }));

      expect(onControl).toHaveBeenCalledWith('on');
    });

    it('lock: shows locked status and unlocks', async () => {
      const onControl = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<DeviceCard device={makeDevice({ type: 'lock', status: { lock: 'locked' } })} onControl={onControl} />);

      expect(screen.getByText(/locked/i)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /unlock/i }));

      expect(onControl).toHaveBeenCalledWith('unlock');
    });

    it('lock: shows unlocked status and locks', async () => {
      const onControl = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<DeviceCard device={makeDevice({ type: 'lock', status: { lock: 'unlocked' } })} onControl={onControl} />);

      expect(screen.getByText(/unlocked/i)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /^lock$/i }));

      expect(onControl).toHaveBeenCalledWith('lock');
    });

    it('climate: shows the temperature and has no toggle button', () => {
      render(<DeviceCard device={makeDevice({ type: 'climate', status: { temperature: 70 } })} onControl={vi.fn()} />);

      expect(screen.getAllByText(/70°F/).length).toBeGreaterThan(0);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('sensor/other: shows "Unknown" status and no toggle button', () => {
      render(<DeviceCard device={makeDevice({ type: 'sensor', status: {} })} onControl={vi.fn()} />);

      expect(screen.getByText(/unknown/i)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('should disable the toggle button while loading', () => {
    render(<DeviceCard device={makeDevice({ type: 'light', status: { switch: 'off' } })} onControl={vi.fn()} loading />);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button')).toHaveTextContent('...');
  });

  it('climate: dragging the temperature slider calls onControl with setTemperature', () => {
    const onControl = vi.fn();
    render(<DeviceCard device={makeDevice({ type: 'climate', status: { temperature: 70 } })} onControl={onControl} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } });

    expect(onControl).toHaveBeenCalledWith('setTemperature', [75]);
  });

  it('light with a defined brightness level renders a brightness slider', () => {
    const onControl = vi.fn();
    render(<DeviceCard device={makeDevice({ type: 'light', status: { switch: 'on', level: 50 } })} onControl={onControl} />);

    expect(screen.getByText(/brightness: 50%/i)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '80' } });

    expect(onControl).toHaveBeenCalledWith('setBrightness', [80]);
  });

  it('light without a level does not render a brightness slider', () => {
    render(<DeviceCard device={makeDevice({ type: 'light', status: { switch: 'on' } })} onControl={vi.fn()} />);

    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });
});
