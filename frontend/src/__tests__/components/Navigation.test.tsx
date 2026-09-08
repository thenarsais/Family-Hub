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
// The top bar reads weather for the temp chip; stub it so this suite doesn't
// fire a real (unmocked) fetch that logs during teardown.
vi.mock('@hooks/useWeather', () => ({
  useWeather: () => ({ weather: null, loading: false, error: null, units: 'imperial', location: 'Thornton, CO' }),
}));
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

  describe('night-mode toggle', () => {
    it('is absent when no handler is passed', () => {
      render(
        <MemoryRouter>
          <Navigation />
        </MemoryRouter>,
      );
      expect(screen.queryByRole('button', { name: /toggle night mode/i })).not.toBeInTheDocument();
    });

    it('shows a sun in light mode and a moon in dark mode, and calls the handler', async () => {
      const onToggle = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(
        <MemoryRouter>
          <Navigation isNightMode={false} onToggleNightMode={onToggle} />
        </MemoryRouter>,
      );

      const btn = screen.getByRole('button', { name: /toggle night mode/i });
      expect(btn).toHaveAttribute('aria-pressed', 'false');
      await user.click(btn);
      expect(onToggle).toHaveBeenCalledTimes(1);

      rerender(
        <MemoryRouter>
          <Navigation isNightMode onToggleNightMode={onToggle} />
        </MemoryRouter>,
      );
      expect(screen.getByRole('button', { name: /toggle night mode/i })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    it('the title reflects Auto vs an active override', () => {
      const { rerender } = render(
        <MemoryRouter>
          <Navigation isNightMode={false} isNightOverridden={false} onToggleNightMode={vi.fn()} />
        </MemoryRouter>,
      );
      expect(screen.getByRole('button', { name: /toggle night mode/i })).toHaveAttribute(
        'title',
        expect.stringMatching(/auto/i),
      );

      rerender(
        <MemoryRouter>
          <Navigation isNightMode isNightOverridden onToggleNightMode={vi.fn()} />
        </MemoryRouter>,
      );
      expect(screen.getByRole('button', { name: /toggle night mode/i })).toHaveAttribute(
        'title',
        expect.stringMatching(/until the next 9pm\/6am/i),
      );
    });
  });
});
