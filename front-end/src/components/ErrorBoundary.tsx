import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: "40px",
          color: "#fff",
          background: "#141414",
          fontFamily: "monospace",
          minHeight: "100vh",
        }}>
          <h2 style={{ color: "#f48557", marginBottom: 16 }}>Something went wrong</h2>
          <pre style={{ color: "#939393", whiteSpace: "pre-wrap", fontSize: 13 }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
