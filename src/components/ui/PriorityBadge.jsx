import React from 'react';

const PriorityBadge = ({ priority, className = '' }) => {

    const getPriorityStyles = (p) => {
        switch (p?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    const label = priority ? priority.toUpperCase() : 'NORMAL';

    return (
        <span className={`px-2 py-0.5 border rounded text-xs font-semibold uppercase tracking-wider ${getPriorityStyles(priority)} ${className}`}>
            {label}
        </span>
    );
};

export default PriorityBadge;
