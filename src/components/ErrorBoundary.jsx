import { Component } from 'react';

/* Route-level error boundary — a crash in one page never takes down the shell. */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="mono-label mb-5">Runtime error</div>
        <h1 className="m-0 font-bold text-text-bright mb-4" style={{ fontSize: 'clamp(32px,5vw,64px)', letterSpacing: '-0.04em' }}>
          Something broke.
        </h1>
        <p className="text-[14px] text-text-muted max-w-md mb-9">
          Not the kind of exception handling I like to demo. A refresh usually fixes it.
        </p>
        <button
          onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
          className="inline-flex items-center gap-3 font-mono uppercase tracking-widest text-[13px] px-[26px] py-3.5 rounded-[4px] bg-text text-bg border-none cursor-pointer hover:bg-white transition-colors"
        >
          ← Back to safety
        </button>
      </div>
    );
  }
}
