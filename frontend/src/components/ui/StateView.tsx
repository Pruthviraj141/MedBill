import type { ReactNode } from 'react';

export function StateView({ kind, children, onRetry }: { kind: 'loading' | 'empty' | 'error'; children: ReactNode; onRetry?: () => void }) {
  return (
    <div className={`state-view state-${kind}`}>
      {kind === 'loading' ? <div className="skeleton-block" aria-label="Loading" /> : null}
      <strong>{children}</strong>
      {kind === 'error' && onRetry ? <button className="secondary-button" onClick={onRetry}>Retry</button> : null}
    </div>
  );
}
