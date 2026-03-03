import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
            <div className="text-center max-w-md animate-fade-in">
                <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-orange-100 dark:border-orange-800">
                    <AlertTriangle size={36} className="text-[#ea580c]" />
                </div>

                <h1 className="text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-2">404</h1>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3">Page Not Found</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <button
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="inline-flex items-center gap-2 bg-[#ea580c] hover:bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm focus:outline-none focus:ring-4 focus:ring-orange-500/30"
                >
                    <Home size={18} />
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFound;
