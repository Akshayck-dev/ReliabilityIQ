import React from 'react';

const Badge = ({ status, className = '' }) => {

    const getStatusStyles = (s) => {
        switch (s?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
            case 'in_progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
            case 'pending': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const label = status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)} ${className}`}>
            {label}
        </span>
    );
};

export default Badge;
