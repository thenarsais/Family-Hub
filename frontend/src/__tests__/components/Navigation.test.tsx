import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '@/components/Navigation';

const { mockUseAuth, mockNavigate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { name: 'Alice', email: 'alice@example.com' },
      logout: vi.fn(),
    });
  });

  it('should display the user name and email', () => {
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('should link to dashboard and activity board', () => {
    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /activity board/i })).toHaveAttribute('href', '/activity');
  });

  it('should log out and navigate to /login when the logout button is clicked', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ user: { name: 'Alice', email: 'alice@example.com' }, logout });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Navigation />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
