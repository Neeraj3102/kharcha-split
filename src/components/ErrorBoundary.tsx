import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In production, do not leak stack traces or internal paths to users
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetLocal = () => {
    if (window.confirm('Resetting local temporary cache will refresh the interface. Your cloud room ledger will stay safe. Proceed?')) {
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }
      window.location.href = window.location.origin;
    }
  };

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-[#08080a] text-white flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#121217] border border-white/10 p-6 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight">Something went unexpected</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                An interface error occurred, but your expenses and room data are securely preserved in the cloud ledger.
              </p>
            </div>

            {/* In DEV mode only: show technical details. In PROD mode: completely hidden */}
            {isDev && this.state.error && (
              <div className="text-left bg-black/60 rounded-xl p-3 border border-red-500/30 overflow-x-auto text-[11px] font-mono text-rose-300 max-h-40">
                <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                <pre className="text-zinc-500 text-[10px] mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-semibold text-sm transition-all shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetLocal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-medium transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
