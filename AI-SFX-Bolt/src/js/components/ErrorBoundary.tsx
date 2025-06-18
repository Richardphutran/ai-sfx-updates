/**
 * Production-grade React Error Boundary for AI SFX Generator
 * Catches JavaScript errors anywhere in the component tree
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorManager, ErrorCategory, ErrorSeverity } from '../lib/error-manager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to our error management system
    const errorId = errorManager.handleError(
      error,
      ErrorCategory.UI,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        timestamp: Date.now()
      },
      'A critical UI error occurred. The interface will recover automatically.'
    );

    this.setState({ errorId });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console for development
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error ID:', errorId);
    console.groupEnd();
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null
    });
  };

  handleReportError = () => {
    if (this.state.errorId) {
      const debugReport = errorManager.getDebugReport();
      
      // In a real production app, you'd send this to your error reporting service
      console.log('Debug Report:', debugReport);
      
      // For now, copy to clipboard for user to send
      if (navigator.clipboard) {
        navigator.clipboard.writeText(debugReport).then(() => {
          errorManager.success('Debug report copied to clipboard');
        }).catch(() => {
          errorManager.warning('Could not copy debug report');
        });
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">⚠️</div>
            
            <h2 className="error-boundary__title">
              Something went wrong
            </h2>
            
            <p className="error-boundary__message">
              A critical error occurred in the AI SFX Generator interface. 
              Don't worry - your work is safe and the plugin will recover.
            </p>
            
            <div className="error-boundary__details">
              <p><strong>Error:</strong> {this.state.error?.message}</p>
              {this.state.errorId && (
                <p><strong>Error ID:</strong> {this.state.errorId}</p>
              )}
            </div>
            
            <div className="error-boundary__actions">
              <button 
                className="error-boundary__btn error-boundary__btn--primary"
                onClick={this.handleRestart}
              >
                🔄 Restart Interface
              </button>
              
              <button 
                className="error-boundary__btn error-boundary__btn--secondary"
                onClick={this.handleReportError}
              >
                📋 Copy Debug Info
              </button>
            </div>
            
            <details className="error-boundary__stack">
              <summary>Technical Details</summary>
              <pre className="error-boundary__stack-trace">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}