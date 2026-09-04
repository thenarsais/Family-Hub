import { vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '@/pages/ProfilePage';

const { mockUseAuth, mockNavigate, mockUpdateUser } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockNavigate: vi.fn(),
  mockUpdateUser: vi.fn(),
}));

vi.mock('@hooks/useAuth', () => ({ useAuth: mockUseAuth }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('@services/api', () => ({ apiClient: { updateUser: mockUpdateUser } }));

const logout = vi.fn().mockResolvedValue(undefined);
const loadCurrentUser = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  try {
    localStorage.clear();
  } catch {
    /* jsdom without storage — tests that need it are guarded */
  }
  delete document.documentElement.dataset.mehndi;
  mockUseAuth.mockReturnValue({
    user: {
      id: 'u1',
      name: 'Priya',
      email: 'priya@x.com',
      role: 'parent',
      created_at: '2026-01-15T00:00:00Z',
    },
    logout,
    loadCurrentUser,
  });
});

describe('ProfilePage', () => {
  it('shows the identity fields', () => {
    render(<ProfilePage />);
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Priya');
    expect(screen.getByText('priya@x.com')).toBeInTheDocument();
    expect(screen.getByText('parent')).toBeInTheDocument();
    expect(screen.getByText(/member since/i)).toBeInTheDocument();
  });

  it('saves a changed name and refreshes the user', async () => {
    mockUpdateUser.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<ProfilePage />);

    const input = screen.getByLabelText(/display name/i);
    await user.clear(input);
    await user.type(input, 'Priya N');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith('u1', { name: 'Priya N' }));
    expect(loadCurrentUser).toHaveBeenCalled();
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('Save is disabled until the name actually changes', () => {
    render(<ProfilePage />);
    expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
  });

  it('toggling the mehndi border sets the root attribute and persists it', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('checkbox', { name: /mehndi border/i }));
    expect(document.documentElement.dataset.mehndi).toBe('off');
    expect(localStorage.getItem('fh:mehndi')).toBe('off');

    await user.click(screen.getByRole('checkbox', { name: /mehndi border/i }));
    expect(document.documentElement.dataset.mehndi).toBeUndefined();
    expect(localStorage.getItem('fh:mehndi')).toBeNull();
  });

  it('reset card layout clears the stored order keys', async () => {
    localStorage.setItem('fh:cardOrder:u1', '["a"]');
    localStorage.setItem('fh:cardOrder:default', '["b"]');
    localStorage.setItem('unrelated', 'keep');
    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /reset card layout/i }));

    expect(localStorage.getItem('fh:cardOrder:u1')).toBeNull();
    expect(localStorage.getItem('fh:cardOrder:default')).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
    expect(screen.getByText(/card layout reset/i)).toBeInTheDocument();
  });

  it('signs out and returns to /login', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
