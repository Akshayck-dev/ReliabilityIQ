import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Reusable network error component with retry button.
 * Drop-in replacement for inline error states across pages.
 */
const NetworkError = ({
    message = 'Something went wrong. Please check your connection and try again.',
    onRetry
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/50 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center animate-fade-in">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                <WifiOff size={26} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load data</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            )}
        </div>
    );
};

export default NetworkError;
