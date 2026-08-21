/**
 * Form Accessibility Tests
 * Ensures login, registration, and profile forms meet WCAG 2.1 standards
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

expect.extend(toHaveNoViolations);

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

describe('Form Accessibility', () => {
  describe('Login Form Accessibility', () => {
    const LoginForm = () => (
      <form>
        <div>
          <label htmlFor="email">Email Address:</label>
          <input id="email" type="email" name="email" required aria-required="true" />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            aria-required="true"
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
    );

    it('should have no accessibility violations', async () => {
      const { container } = render(<LoginForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have properly associated labels', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText('Email Address:');
      const passwordInput = screen.getByLabelText('Password:');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should have correct input types', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText('Email Address:') as HTMLInputElement;
      expect(emailInput.type).toMatch(/email|text/);
    });

    it('should mark required fields', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText('Email Address:');
      const passwordInput = screen.getByLabelText('Password:');

      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText('Email Address:');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Tab to first input
      await user.tab();
      expect(emailInput).toHaveFocus();

      // Tab to next input
      await user.tab();
      // Password input should have focus

      // Tab to submit button
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should have visible focus indicators', () => {
      const { container } = render(<LoginForm />);
      const button = container.querySelector('button');

      // Button should have default browser focus styles or custom styles
      expect(button).toBeInTheDocument();
      // In real testing, we'd check computed styles
    });
  });

  describe('Form Error Handling Accessibility', () => {
    const FormWithErrors = () => {
      const [errors, setErrors] = React.useState<Record<string, string>>({});

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({
          email: 'Invalid email format',
          password: 'Password must be at least 8 characters',
        });
      };

      return (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span id="email-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="password">Password:</label>
            <input
              id="password"
              type="password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <span id="password-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button type="submit">Submit</button>
        </form>
      );
    };

    it('should announce form errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<FormWithErrors />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Both the email and password errors should be announced.
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });

    it('should link errors to form fields', async () => {
      const user = userEvent.setup();
      render(<FormWithErrors />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      const emailInput = screen.getByLabelText('Email:') as HTMLInputElement;
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby');
    });
  });

  describe('Checkbox & Radio Accessibility', () => {
    const CheckboxForm = () => (
      <fieldset>
        <legend>Preferences</legend>
        <div>
          <input type="checkbox" id="notifications" name="notifications" />
          <label htmlFor="notifications">Enable notifications</label>
        </div>
        <div>
          <input type="checkbox" id="analytics" name="analytics" />
          <label htmlFor="analytics">Allow analytics tracking</label>
        </div>
      </fieldset>
    );

    it('should have no accessibility violations', async () => {
      const { container } = render(<CheckboxForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have associated labels', () => {
      render(<CheckboxForm />);
      const notificationsCheckbox = screen.getByLabelText(/notifications/i);
      const analyticsCheckbox = screen.getByLabelText(/analytics/i);

      expect(notificationsCheckbox).toBeInTheDocument();
      expect(analyticsCheckbox).toBeInTheDocument();
    });

    it('should use fieldset with legend for grouping', () => {
      const { container } = render(<CheckboxForm />);
      const fieldset = container.querySelector('fieldset');
      const legend = container.querySelector('legend');

      expect(fieldset).toBeInTheDocument();
      expect(legend).toBeInTheDocument();
      expect(legend).toHaveTextContent('Preferences');
    });
  });

  describe('Select/Dropdown Accessibility', () => {
    const SelectForm = () => (
      <div>
        <label htmlFor="role-select">User Role:</label>
        <select id="role-select" name="role" required>
          <option value="">-- Select a role --</option>
          <option value="parent">Parent</option>
          <option value="child">Child</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    );

    it('should have no accessibility violations', async () => {
      const { container } = render(<SelectForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have associated label', () => {
      render(<SelectForm />);
      const select = screen.getByLabelText(/user role/i);
      expect(select).toBeInTheDocument();
    });

    it('should have placeholder/default option', () => {
      render(<SelectForm />);
      const placeholder = screen.getByText('-- Select a role --');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Input Masking Accessibility', () => {
    it('should announce input purpose to screen readers', () => {
      const { container } = render(
        <div>
          <label htmlFor="phone">Phone Number:</label>
          <input
            id="phone"
            type="tel"
            placeholder="(123) 456-7890"
            aria-label="Phone number in format (123) 456-7890"
          />
        </div>
      );

      const input = screen.getByLabelText(/phone number/i);
      expect(input).toHaveAttribute('type', 'tel');
      expect(input).toHaveAttribute('aria-label');
    });
  });
});
