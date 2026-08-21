/**
 * Authentication Pages Tests
 * Tests Login and Signup page components
 *
 * The previous version of this file never imported the real Login/Signup
 * pages — it rendered inline `MockLoginPage`/`MockSignupPage` components
 * that happened to have similar form fields, so it always passed regardless
 * of what the real pages did. Rewritten against the real components,
 * mocking useAuthStore (the only external dependency they call).
 */

import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';

const mockLogin = vi.fn();
const mockSignup = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@stores/authStore', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    signup: mockSignup,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Authentication Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Page', () => {
    it('should render the login form', () => {
      renderWithRouter(<Login />);

      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should mask the password input', () => {
      renderWithRouter(<Login />);
      expect(screen.getByPlaceholderText('Enter your password')).toHaveAttribute('type', 'password');
    });

    it('should have a link to signup', () => {
      renderWithRouter(<Login />);
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
    });

    it('should call login with the entered credentials and navigate on success', async () => {
      mockLogin.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      renderWithRouter(<Login />);
      await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show an error message and not navigate when login fails', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      const user = userEvent.setup();

      renderWithRouter(<Login />);
      await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'wrong');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should require email and password before submitting', () => {
      renderWithRouter(<Login />);

      expect(screen.getByPlaceholderText('Enter your email')).toBeRequired();
      expect(screen.getByPlaceholderText('Enter your password')).toBeRequired();
    });

    it('should disable the submit button while logging in', async () => {
      let resolveLogin: () => void;
      mockLogin.mockReturnValueOnce(new Promise<void>((resolve) => { resolveLogin = resolve; }));
      const user = userEvent.setup();

      renderWithRouter(<Login />);
      await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
      resolveLogin!();
    });
  });

  describe('Signup Page', () => {
    it('should render the signup form', () => {
      renderWithRouter(<Signup />);

      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('should call signup and navigate on success', async () => {
      mockSignup.mockResolvedValueOnce(undefined);
      const user = userEvent.setup();

      renderWithRouter(<Signup />);
      await user.type(screen.getByPlaceholderText('Enter your full name'), 'New User');
      await user.type(screen.getByPlaceholderText('Enter your email'), 'newuser@example.com');
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('newuser@example.com', 'password123', 'New User');
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should reject mismatched passwords without calling signup', async () => {
      const user = userEvent.setup();

      renderWithRouter(<Signup />);
      await user.type(screen.getByPlaceholderText('Enter your full name'), 'New User');
      await user.type(screen.getByPlaceholderText('Enter your email'), 'newuser@example.com');
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'different');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      expect(mockSignup).not.toHaveBeenCalled();
    });

    it('should surface a signup failure as an error message', async () => {
      mockSignup.mockRejectedValueOnce(new Error('fail'));
      const user = userEvent.setup();

      renderWithRouter(<Signup />);
      await user.type(screen.getByPlaceholderText('Enter your full name'), 'User');
      await user.type(screen.getByPlaceholderText('Enter your email'), 'user@example.com');
      await user.type(screen.getByPlaceholderText('Create a password'), 'password123');
      await user.type(screen.getByPlaceholderText('Confirm your password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(screen.getByText('Signup failed')).toBeInTheDocument();
      });
    });

    it('should have a link back to login', () => {
      renderWithRouter(<Signup />);
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    });

    it('should not display the raw password value anywhere else on the page', async () => {
      const user = userEvent.setup();
      renderWithRouter(<Signup />);
      await user.type(screen.getByPlaceholderText('Create a password'), 'super-secret-pw');

      expect(screen.queryByText('super-secret-pw')).not.toBeInTheDocument();
    });
  });
});
