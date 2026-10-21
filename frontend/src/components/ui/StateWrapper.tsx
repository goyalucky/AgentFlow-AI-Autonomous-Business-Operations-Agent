import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

interface StateWrapperProps {
  loading: boolean;
  error: string | null;
  empty: boolean;
  children: ReactNode;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRetry?: () => void;
}

export default function StateWrapper({
  loading,
  error,
  empty,
  children,
  emptyMessage = 'No data available yet.',
  emptyIcon,
  onRetry,
}: StateWrapperProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-error-500/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-error-400" />
        </div>
        <p className="text-sm text-gray-400 max-w-sm text-center">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary mt-1">
            Try again
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-base-800 flex items-center justify-center">
          {emptyIcon || <Inbox className="w-6 h-6 text-gray-500" />}
        </div>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return <>{children}</>;
}
