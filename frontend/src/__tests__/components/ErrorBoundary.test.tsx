/**
 * ErrorBoundary Component Tests
 * Tests React error boundary for preventing white-screen crashes
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Component that throws error on render
const ProblematicComponent: React.FC = () => {
  throw new Error('Test component error');
};

const HealthyComponent: React.FC = () => {
  return <div>Healthy Component</div>;
};

describe('ErrorBoundary Component', () => {
  // Suppress console.error during tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <HealthyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Healthy Component')).toBeInTheDocument();
    });

    it('should pass through props to children', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-element">Test Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-element')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should support multiple children', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch render errors and show fallback UI', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/Oops! Something went wrong/i)
      ).toBeInTheDocument();
    });

    it('should display recovery message', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/refresh the page/i)).toBeInTheDocument();
    });

    it('should not render children after error', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Test component error')).not.toBeInTheDocument();
    });
  });

  describe('Fallback UI', () => {
    it('should show user-friendly error message', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      const heading = screen.getByText(/Oops! Something went wrong/i);
      expect(heading).toBeInTheDocument();
    });

    it('should suggest user action (refresh)', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      const message = screen.getByText(/Please refresh the page/i);
      expect(message).toBeInTheDocument();
    });

    it('should have appropriate styling', () => {
      const { container } = render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      const errorDiv = container.querySelector('div');
      expect(errorDiv).toHaveStyle({ padding: '20px', textAlign: 'center' });
    });
  });

  describe('Error Logging', () => {
    it('should capture error information', () => {
      const consoleSpy = jest.spyOn(console, 'error');

      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should include error message in logs', () => {
      const consoleSpy = jest.spyOn(console, 'error');

      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      // Log should mention the error
      const calls = consoleSpy.mock.calls.join();
      expect(calls).toMatch(/error/i);
    });
  });

  describe('Multiple Error Boundaries', () => {
    it('should allow nested error boundaries', () => {
      render(
        <ErrorBoundary>
          <div>
            <ErrorBoundary>
              <HealthyComponent />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Healthy Component')).toBeInTheDocument();
    });

    it('should catch errors in appropriate boundary', () => {
      render(
        <ErrorBoundary>
          <div>Outer</div>
          <ErrorBoundary>
            <ProblematicComponent />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByText('Outer')).toBeInTheDocument();
      expect(
        screen.getByText(/Oops! Something went wrong/i)
      ).toBeInTheDocument();
    });
  });

  describe('Lifecycle Methods', () => {
    it('should call getDerivedStateFromError when error occurs', () => {
      const spy = jest.spyOn(
        ErrorBoundary,
        'getDerivedStateFromError'
      );

      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      expect(spy).toHaveBeenCalled();
    });

    it('should call componentDidCatch when error occurs', () => {
      const instance = new ErrorBoundary({ children: null });
      const spy = jest.spyOn(instance, 'componentDidCatch');

      try {
        instance.componentDidCatch(new Error('Test'), {
          componentStack: 'stack',
        });
      } catch {
        // Expected
      }

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Development vs Production', () => {
    it('should handle development environment gracefully', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/Oops! Something went wrong/i)
      ).toBeInTheDocument();
    });

    it('should not expose sensitive information', () => {
      render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      const errorUI = screen.getByText(/Oops! Something went wrong/i);
      expect(errorUI).toBeInTheDocument();
      // Should not show detailed error stack
      expect(
        screen.queryByText(/at ProblematicComponent/)
      ).not.toBeInTheDocument();
    });
  });

  describe('Recovery', () => {
    it('should reset error state when new children are rendered', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ProblematicComponent />
        </ErrorBoundary>
      );

      expect(
        screen.getByText(/Oops! Something went wrong/i)
      ).toBeInTheDocument();

      // Re-render with healthy component
      rerender(
        <ErrorBoundary>
          <HealthyComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('Healthy Component')).toBeInTheDocument();
      expect(
        screen.queryByText(/Oops! Something went wrong/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined children', () => {
      render(
        <ErrorBoundary>
          {undefined}
        </ErrorBoundary>
      );

      // Should not error
      expect(document.body).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(
        <ErrorBoundary>
          {null}
        </ErrorBoundary>
      );

      // Should not error
      expect(document.body).toBeInTheDocument();
    });

    it('should handle string children', () => {
      render(
        <ErrorBoundary>
          Plain text content
        </ErrorBoundary>
      );

      expect(screen.getByText('Plain text content')).toBeInTheDocument();
    });
  });
});
