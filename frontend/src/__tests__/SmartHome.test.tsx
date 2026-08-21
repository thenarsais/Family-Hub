import { vi, type Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartHome } from '../components/SmartHome/SmartHome';
import { DeviceCard } from '../components/SmartHome/DeviceCard';
import * as deviceHook from '../hooks/useDevices';

// Mock the useDevices hook
vi.mock('../hooks/useDevices');

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
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [],
      loading: true,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);
    expect(screen.getByText('Loading devices...')).toBeInTheDocument();
  });

  it('should display all devices when loaded', async () => {
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('Living Room Light')).toBeInTheDocument();
    expect(screen.getByText('Front Door')).toBeInTheDocument();
    expect(screen.getByText('Main Thermostat')).toBeInTheDocument();
  });

  it('should group devices by room', () => {
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);

    // "Living Room" legitimately appears twice — once as the room-group
    // heading, once as the device's own room label inside its card — so
    // this one needs to target the heading specifically.
    expect(screen.getByRole('heading', { name: 'Living Room' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Entry' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Hallway' })).toBeInTheDocument();
  });

  it('should display error message when devices fail to load', () => {
    const errorMsg = 'Failed to load devices';
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: errorMsg,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('Error Loading Devices')).toBeInTheDocument();
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });

  it('should show empty state when no devices', () => {
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('No Devices Found')).toBeInTheDocument();
    expect(screen.getByText('Connect your SmartThings devices to get started')).toBeInTheDocument();
  });

  it('should display correct device count', () => {
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);

    expect(screen.getByText('3 devices connected')).toBeInTheDocument();
  });

  it('should call refreshDevices when refresh button is clicked', () => {
    const mockRefresh = vi.fn();
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: mockDevices,
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: mockRefresh,
      controlDevice: vi.fn(),
    });

    render(<SmartHome />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalled();
  });
});

describe('DeviceCard Component', () => {
  const mockControl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
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
    // Rendered as "Status: 🟢 On" in one paragraph — an exact match for
    // just the status portion won't find a node whose own text is exactly
    // that substring, since it's combined with the "Status: " prefix.
    expect(screen.getByText(/🟢 On/)).toBeInTheDocument();
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
    expect(screen.getByText(/🔒 Locked/)).toBeInTheDocument();
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
    // "72°F" legitimately appears twice — once in the status line, once in
    // a "Set to 72°F" control label — so this checks presence, not a
    // single unique match.
    expect(screen.getAllByText(/72°F/).length).toBeGreaterThan(0);
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
