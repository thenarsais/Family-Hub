import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartHome } from '../components/SmartHome/SmartHome';
import { DeviceCard } from '../components/SmartHome/DeviceCard';
import * as deviceHook from '../hooks/useDevices';

// Mock the useDevices hook
jest.mock('../hooks/useDevices');

const mockDevices = [
  {
    deviceId: 'light-1',
    name: 'Living Room Light',
    type: 'light' as const,
    room: 'Living Room',
    status: { switch: 'on', level: 100 },
  },
  {
    deviceId: 'lock-1',
    name: 'Front Door',
    type: 'lock' as const,
    room: 'Entry',
    status: { lock: 'locked' },
  },
  {
    deviceId: 'thermostat-1',
    name: 'Main Thermostat',
    type: 'climate' as const,
    room: 'Hallway',
    status: { temperature: 72 },
  },
];

describe('SmartHome Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (deviceHook.useDevices as jest.Mock).mockReturnValue({
      devices: [],
      loading: true,
      error: null,
      refreshing: false,
      refreshDevices: jest.fn(),
      controlDevice: jest.fn(),
    });

    render(<SmartHome />);
    expect(screen.getByText('Loading devices...')).toBeInTheDocument();
  });

  it('should display all devices when loaded', async () => {
    (deviceHook.useDevices as jest.Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: jest.fn(),
      controlDevice: jest.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('Living Room Light')).toBeInTheDocument();
    expect(screen.getByText('Front Door')).toBeInTheDocument();
    expect(screen.getByText('Main Thermostat')).toBeInTheDocument();
  });

  it('should group devices by room', () => {
    (deviceHook.useDevices as jest.Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: jest.fn(),
      controlDevice: jest.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('Living Room')).toBeInTheDocument();
    expect(screen.getByText('Entry')).toBeInTheDocument();
    expect(screen.getByText('Hallway')).toBeInTheDocument();
  });

  it('should display error message when devices fail to load', () => {
    const errorMsg = 'Failed to load devices';
    (deviceHook.useDevices as jest.Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: errorMsg,
      refreshing: false,
      refreshDevices: jest.fn(),
      controlDevice: jest.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('Error Loading Devices')).toBeInTheDocument();
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });

  it('should show empty state when no devices', () => {
    (deviceHook.useDevices as jest.Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: jest.fn(),
      controlDevice: jest.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('No Devices Found')).toBeInTheDocument();
    expect(screen.getByText('Connect your SmartThings devices to get started')).toBeInTheDocument();
  });

  it('should display correct device count', () => {
    (deviceHook.useDevices as jest.Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: jest.fn(),
      controlDevice: jest.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('3 devices connected')).toBeInTheDocument();
  });

  it('should call refreshDevices when refresh button is clicked', () => {
    const mockRefresh = jest.fn();
    (deviceHook.useDevices as jest.Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: mockRefresh,
      controlDevice: jest.fn(),
    });

    render(<SmartHome />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalled();
  });
});

describe('DeviceCard Component', () => {
  const mockControl = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render light device correctly', () => {
    render(
      <DeviceCard
        device={mockDevices[0]}
        onControl={mockControl}
        loading={false}
      />
    );

    expect(screen.getByText('Living Room Light')).toBeInTheDocument();
    expect(screen.getByText('Living Room')).toBeInTheDocument();
    expect(screen.getByText('🟢 On')).toBeInTheDocument();
  });

  it('should render lock device status correctly', () => {
    render(
      <DeviceCard
        device={mockDevices[1]}
        onControl={mockControl}
        loading={false}
      />
    );

    expect(screen.getByText('Front Door')).toBeInTheDocument();
    expect(screen.getByText('🔒 Locked')).toBeInTheDocument();
  });

  it('should render thermostat temperature', () => {
    render(
      <DeviceCard
        device={mockDevices[2]}
        onControl={mockControl}
        loading={false}
      />
    );

    expect(screen.getByText('Main Thermostat')).toBeInTheDocument();
    expect(screen.getByText('72°F')).toBeInTheDocument();
  });

  it('should call onControl when toggle button is clicked', () => {
    render(
      <DeviceCard
        device={mockDevices[0]}
        onControl={mockControl}
        loading={false}
      />
    );

    const toggleButton = screen.getByText('Turn Off');
    fireEvent.click(toggleButton);

    expect(mockControl).toHaveBeenCalled();
  });

  it('should show loading state on toggle button', () => {
    render(
      <DeviceCard
        device={mockDevices[0]}
        onControl={mockControl}
        loading={true}
      />
    );

    const toggleButton = screen.getByText('...');
    expect(toggleButton).toBeDisabled();
  });
});
