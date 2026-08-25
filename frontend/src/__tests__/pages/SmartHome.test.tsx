import { vi, type Mock } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartHomePage from '@/pages/SmartHome';
import * as deviceHook from '@/hooks/useDevices';

vi.mock('@/hooks/useDevices');

describe('SmartHome page', () => {
  it('should render the SmartHome component', () => {
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });

    render(<SmartHomePage />);

    expect(screen.getByText('Smart Home')).toBeInTheDocument();
  });
});
