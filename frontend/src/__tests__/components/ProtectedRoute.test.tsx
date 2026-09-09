import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));

import { useKioskStore } from '@stores/kioskStore';

function renderAt(path = '/secret') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={<div>Secret</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useKioskStore.setState({ deviceToken: null });
});

describe('ProtectedRoute', () => {
  it('renders the child when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    renderAt();
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    renderAt();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('shows a spinner while the session resolves', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    const { container } = renderAt();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('allows access in kiosk mode even without a user session', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    useKioskStore.setState({ deviceToken: 'dev-tok' });
    renderAt();
    expect(screen.getByText('Secret')).toBeInTheDocument();
  });
});
