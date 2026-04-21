import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('RENDER ERROR:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm space-y-1">
          <div className="font-semibold">Render error</div>
          <div className="mono text-xs opacity-80">{this.state.error.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
