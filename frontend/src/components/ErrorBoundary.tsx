import React from 'react';
import { captureException } from '@/config/sentry';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture to Sentry (non-blocking)
    if (window.location.origin !== 'http://localhost:5173') {
      captureException(error, {
        extra: { componentStack: errorInfo.componentStack }
      });
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Without this, a boundary that's caught an error stays stuck on the
    // fallback UI forever, even after the parent re-renders with entirely
    // different (valid) children — the only way out would be a full page
    // reload. Reset once the children actually change.
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Oops! Something went wrong</h1>
          <p>We've been notified. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
