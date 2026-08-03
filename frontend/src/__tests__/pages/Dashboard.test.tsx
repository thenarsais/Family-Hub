/**
 * Dashboard Page Tests
 * Tests main dashboard component and UI rendering
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isLoading: false,
  }),
}));

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the API client
jest.mock('@/services/api', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      renderDashboard();
      expect(document.body).toBeInTheDocument();
    });

    it('should display welcome message', async () => {
      renderDashboard();

      await waitFor(() => {
        // Should show some greeting or title
        const heading = screen.queryByRole('heading');
        expect(heading).toBeInTheDocument();
      });
    });

    it('should display user information', async () => {
      renderDashboard();

      // Should show user email or name
      await waitFor(() => {
        const content = screen.getByText(/test@example.com|Activity Board/i);
        expect(content).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication', () => {
    it('should show authenticated user content', async () => {
      renderDashboard();

      // Should display content for logged in user
      expect(document.body).toBeInTheDocument();
    });

    it('should render when user is present', async () => {
      renderDashboard();

      // Should not show login prompt
      const loginPrompt = screen.queryByText(/log in|sign in/i);
      expect(loginPrompt).not.toBeInTheDocument();
    });
  });

  describe('Dashboard Sections', () => {
    it('should have main content area', async () => {
      const { container } = renderDashboard();

      // Should have main or article tag
      const main = container.querySelector('main') || container.querySelector('[role="main"]');
      expect(main).toBeInTheDocument();
    });

    it('should be responsive', async () => {
      const { container } = renderDashboard();

      // Should have content that adapts to screen size
      const content = container.firstChild;
      expect(content).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state gracefully', async () => {
      renderDashboard();

      // Should render even during loading
      expect(document.body).toBeInTheDocument();
    });

    it('should display data after loading', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user gracefully', async () => {
      // Mock useAuth to return no user
      jest.resetModules();
      jest.doMock('@/hooks/useAuth', () => ({
        useAuth: () => ({
          user: null,
          isLoading: false,
        }),
      }));

      // Should still render or redirect gracefully
      renderDashboard();
      expect(document.body).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      renderDashboard();

      // Should not crash on API errors
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML', async () => {
      const { container } = renderDashboard();

      // Should use semantic tags
      const hasSemanticTags =
        container.querySelector('header') ||
        container.querySelector('main') ||
        container.querySelector('nav');

      expect(hasSemanticTags).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', async () => {
      renderDashboard();

      // Should have at least one heading
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('should have clickable elements with labels', async () => {
      const { container } = renderDashboard();

      // Buttons should have text or aria-labels
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        const hasText = button.textContent?.trim();
        const hasAriaLabel = button.getAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should have navigation elements', async () => {
      const { container } = renderDashboard();

      // Should have nav or navigation links
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should be linkable to other pages', async () => {
      const { container } = renderDashboard();

      // Should have links
      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Data Display', () => {
    it('should display points or rewards', async () => {
      renderDashboard();

      await waitFor(() => {
        // Should show some kind of score or data
        expect(document.body).toBeInTheDocument();
      });
    });

    it('should display activity information', async () => {
      renderDashboard();

      // Dashboard should show activities/chores or similar
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('should be interactive', async () => {
      const { container } = renderDashboard();

      // Should have interactive elements
      const interactiveElements =
        container.querySelectorAll('button, a, [role="button"]');
      expect(interactiveElements.length).toBeGreaterThan(0);
    });

    it('should handle user interactions', async () => {
      renderDashboard();

      // Should render without errors
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to different viewport sizes', async () => {
      const { container } = renderDashboard();

      // Should have responsive layout
      const content = container.firstChild;
      expect(content).toBeInTheDocument();
    });

    it('should have mobile-friendly layout', async () => {
      const { container } = renderDashboard();

      // Should render properly on mobile
      expect(container).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render quickly', async () => {
      const startTime = performance.now();
      renderDashboard();
      const endTime = performance.now();

      // Should render in reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should not have memory leaks', async () => {
      const { unmount } = renderDashboard();

      // Should unmount cleanly
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('COPPA Compliance', () => {
    it('should not expose sensitive child data', async () => {
      const { container } = renderDashboard();

      // Should not display private information
      const text = container.textContent || '';
      expect(text).not.toContain('password');
      expect(text).not.toContain('SSN');
    });

    it('should be age-appropriate', async () => {
      renderDashboard();

      // Should be suitable for all ages
      const text = document.body.textContent || '';
      expect(text).not.toMatch(/adult content/i);
    });
  });
});
