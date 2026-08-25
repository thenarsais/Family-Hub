import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

const { mockUseAuth, mockInitializeFromStorage } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockInitializeFromStorage: vi.fn(),
}));

vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('@stores/authStore', () => ({
  useAuthStore: { getState: () => ({ initializeFromStorage: mockInitializeFromStorage }) },
}));

// Stub every page/component App renders so this test isolates App's own
// routing/redirect logic, not each page's internals (those have their own
// dedicated tests).
vi.mock('@pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock('@pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('@pages/Signup', () => ({ default: () => <div>Signup Page</div> }));
vi.mock('@pages/ActivityBoard', () => ({ default: () => <div>Activity Page</div> }));
vi.mock('@pages/SmartHome', () => ({ default: () => <div>SmartHome Page</div> }));
vi.mock('@pages/NotFound', () => ({ default: () => <div>404 Page</div> }));
vi.mock('@components/Navigation', () => ({ default: () => <nav>Main Navigation</nav> }));
vi.mock('@components/ProtectedRoute', () => {
  const { Outlet } = require('react-router-dom');
  return { default: () => (mockUseAuth().isAuthenticated ? <Outlet /> : <div>Login Page</div>) };
});

function setPath(path: string) {
  window.history.pushState({}, '', path);
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call initializeFromStorage once on mount', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    setPath('/login');

    render(<App />);

    expect(mockInitializeFromStorage).toHaveBeenCalledTimes(1);
  });

  it('should show a loading spinner while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    setPath('/dashboard');

    const { container } = render(<App />);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });

  it('should not render Navigation when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    setPath('/login');

    render(<App />);

    expect(screen.queryByText('Main Navigation')).not.toBeInTheDocument();
  });

  it('should render Navigation when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    setPath('/dashboard');

    render(<App />);

    expect(screen.getByText('Main Navigation')).toBeInTheDocument();
  });

  it('should render Login at /login when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    setPath('/login');

    render(<App />);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should redirect away from /login to /dashboard when already authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    setPath('/login');

    render(<App />);

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should redirect away from /signup to /dashboard when already authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    setPath('/signup');

    render(<App />);

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('should render Signup at /signup when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    setPath('/signup');

    render(<App />);

    expect(screen.getByText('Signup Page')).toBeInTheDocument();
  });

  it('should render protected pages when authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    setPath('/activity');

    render(<App />);

    expect(screen.getByText('Activity Page')).toBeInTheDocument();
  });

  it('should redirect the root path to /dashboard', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    setPath('/');

    render(<App />);

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('should render the 404 page for an unknown route', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    setPath('/this-route-does-not-exist');

    render(<App />);

    expect(screen.getByText('404 Page')).toBeInTheDocument();
  });
});
