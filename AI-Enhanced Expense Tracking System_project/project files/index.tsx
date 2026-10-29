import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AI EXPENSE TRACKING encountered an unhandled error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-slate-900">Application Notice</h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              An unexpected display issue occurred. Your saved transaction records are safe in your browser storage.
            </p>
            {this.state.error && (
              <pre className="text-[11px] p-3 bg-gray-50 rounded-xl text-left overflow-x-auto text-gray-600 font-mono border border-gray-100">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    if ('serviceWorker' in navigator) {
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      for (const reg of registrations) {
                        await reg.unregister();
                      }
                    }
                    if ('caches' in window) {
                      const keys = await caches.keys();
                      for (const key of keys) {
                        await caches.delete(key);
                      }
                    }
                  } catch {}
                  window.location.href = window.location.origin + window.location.pathname + '?reload=' + Date.now();
                }}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('This will reset your local settings to defaults. Proceed?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
