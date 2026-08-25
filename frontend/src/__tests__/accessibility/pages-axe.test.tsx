/**
 * Runs jest-axe against the real page components (not synthetic markup).
 * form-accessibility.test.tsx checks hand-rolled form fixtures that verify
 * WCAG *patterns* in the abstract; this file checks what the app actually
 * ships, using the same render/mock setup as each page's own test file.
 */

import { vi, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import SmartHomePage from '@/pages/SmartHome';
import ActivityBoard from '@/pages/ActivityBoard';
import * as deviceHook from '@/hooks/useDevices';

expect.extend(toHaveNoViolations);

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

vi.mock('@stores/authStore', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    signup: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    isLoading: false,
  }),
}));

vi.mock('@/services/api', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@/hooks/useDevices');

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Real page accessibility (axe)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (deviceHook.useDevices as Mock).mockReturnValue({
      devices: [],
      loading: false,
      error: null,
      refreshing: false,
      refreshDevices: vi.fn(),
      controlDevice: vi.fn(),
    });
  });

  it('Login page has no axe violations', async () => {
    const { container } = renderWithRouter(<Login />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Signup page has no axe violations', async () => {
    const { container } = renderWithRouter(<Signup />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('Dashboard page has no axe violations', async () => {
    const { container } = renderWithRouter(<Dashboard />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('SmartHome page has no axe violations', async () => {
    const { container } = render(<SmartHomePage />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('ActivityBoard page has no axe violations', async () => {
    const { container } = render(<ActivityBoard />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
