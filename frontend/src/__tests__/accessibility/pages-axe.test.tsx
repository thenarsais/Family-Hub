/**
 * Runs jest-axe against the real page components (not synthetic markup).
 * form-accessibility.test.tsx checks hand-rolled form fixtures that verify
 * WCAG *patterns* in the abstract; this file checks what the app actually
 * ships, using the same render/mock setup as each page's own test file.
 */

import { vi, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import SmartHomePage from '@/pages/SmartHome';
import ActivityBoard from '@/pages/ActivityBoard';
import KidsBoard from '@/pages/KidsBoard';
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

vi.mock('@/hooks/useFamily', () => ({
  useFamily: () => ({
    loading: false,
    members: [
      { user_id: 'user-1', role: 'parent', name: 'Test User' },
      { user_id: 'kid-1', role: 'child', name: 'Karishma Kid' },
    ],
  }),
}));

vi.mock('@/hooks/useKidBoard', () => ({
  useKidBoard: () => ({
    routines: [
      { id: 'r1', userId: 'kid-1', slot: 'morning', label: 'Brush teeth', emoji: '🪥', sortOrder: 0, enabled: true, doneToday: false },
      { id: 'r2', userId: 'kid-1', slot: 'evening', label: 'Pajamas', emoji: '👕', sortOrder: 0, enabled: true, doneToday: true },
    ],
    manageRoutines: [],
    todayMood: null,
    loading: false,
    error: null,
    completeRoutine: vi.fn(),
    undoRoutine: vi.fn(),
    setMood: vi.fn(),
    createRoutine: vi.fn(),
    updateRoutine: vi.fn(),
    refresh: vi.fn(),
    refreshManage: vi.fn(),
  }),
}));

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

  it('KidsBoard page has no axe violations', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/kids/kid-1']}>
        <Routes>
          <Route path="/kids/:memberId" element={<KidsBoard />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
