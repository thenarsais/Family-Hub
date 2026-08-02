import React from 'react';
import { Sentry } from '@/config/sentry';

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
      Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack }
      });
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
