import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { queryClient } from './lib/queryClient';
import './styles.css';
import './mobile-colors.css';
import './print-receipt.css';
import './upi-animation.css';

// SQLite Diagnostic Toolkit (run via console: window.runDiagnosticTests())
import './db/diagnostics';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);
