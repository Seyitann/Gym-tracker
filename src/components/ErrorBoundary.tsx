import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { ErrorScreen } from "./PageState";

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
    return <ErrorScreen message={this.state.error.message} />;
  }
}
