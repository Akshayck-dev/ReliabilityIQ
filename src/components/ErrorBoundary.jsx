import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service here
        console.error("Global Error Boundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center transition-colors">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md w-full">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Something went wrong</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                            We've encountered an unexpected error. Please try reloading the page to resolve this issue.
                        </p>

                        {/* Only render error details in development if preferred, or globally as requested */}
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 mb-8 border border-slate-100 dark:border-slate-800 text-left overflow-auto max-h-32">
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate break-words whitespace-pre-wrap">
                                {this.state.error && this.state.error.toString()}
                            </p>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full flex justify-center items-center gap-2 bg-[#ea580c] hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/30"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
