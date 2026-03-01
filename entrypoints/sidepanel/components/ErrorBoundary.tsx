/**
 * Error Boundary Component
 * @description Catches JavaScript errors in component tree and displays fallback UI
 */

import { type ReactNode, Component, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Class Component
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console for debugging
    console.error('[Error Boundary] Caught an error:', error);
    console.error('[Error Boundary] Error info:', errorInfo);

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    // Reset state and try to recover
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Reload the page
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>Something went wrong</h1>
            <p>
              The Block Clipper sidebar encountered an unexpected error. This has been logged
              automatically.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Mode)</summary>
                <div className="error-message">
                  <strong>Error:</strong>
                  <pre>{this.state.error.toString()}</pre>
                </div>
                {this.state.errorInfo && (
                  <div className="error-stack">
                    <strong>Component Stack:</strong>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </div>
                )}
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReset} className="reset-button">
                Try Again
              </button>
              <button onClick={this.handleReload} className="reload-button">
                Reload Page
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary-container {
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              padding: 24px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #fafafa;
            }

            .error-boundary-content {
              max-width: 500px;
              text-align: center;
              background: #fff;
              padding: 32px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            }

            .error-icon {
              font-size: 64px;
              margin-bottom: 16px;
            }

            .error-boundary-content h1 {
              font-size: 24px;
              font-weight: 600;
              margin: 0 0 12px 0;
              color: #333;
            }

            .error-boundary-content > p {
              font-size: 15px;
              line-height: 1.6;
              color: #666;
              margin: 0 0 24px 0;
            }

            .error-details {
              margin: 20px 0;
              text-align: left;
              padding: 16px;
              background: #f5f5f5;
              border-radius: 8px;
              border: 1px solid #e0e0e0;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 500;
              color: #333;
              user-select: none;
            }

            .error-details summary:hover {
              color: #555;
            }

            .error-message,
            .error-stack {
              margin-top: 12px;
            }

            .error-message strong,
            .error-stack strong {
              display: block;
              margin-bottom: 4px;
              font-size: 13px;
              color: #555;
            }

            .error-message pre,
            .error-stack pre {
              margin: 0;
              padding: 12px;
              background: #fff;
              border-radius: 4px;
              font-size: 11px;
              line-height: 1.5;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
              color: #c7254e;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 24px;
            }

            .error-actions button {
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.15s;
            }

            .reset-button {
              background: #3498db;
              color: #fff;
            }

            .reset-button:hover {
              background: #2980b9;
            }

            .reload-button {
              background: #f5f5f5;
              color: #333;
            }

            .reload-button:hover {
              background: #e8e8e8;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
