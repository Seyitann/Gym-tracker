import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface State {
  error: Error | null;
}

// Shows the error on screen instead of leaving a blank page
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="bg-gray-800 rounded-2xl p-6 max-w-md space-y-3">
          <p className="text-red-400 font-semibold">Something went wrong</p>
          <p className="text-gray-400 text-sm break-words">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
