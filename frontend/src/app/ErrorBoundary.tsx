import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f4f2ee', color: '#38332a', padding: 20, textAlign: 'center' }}>
          <AlertTriangle size={48} color="#c76d45" style={{ marginBottom: 20 }} />
          <h1 style={{ fontSize: 24, margin: '0 0 10px 0' }}>Something went wrong</h1>
          <p style={{ color: '#8e8a83', maxWidth: 300, marginBottom: 30 }}>An unexpected error prevented the application from rendering.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', backgroundColor: '#38332a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
