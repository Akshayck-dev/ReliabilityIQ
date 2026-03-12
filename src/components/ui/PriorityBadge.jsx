import React from 'react';

const PriorityBadge = ({ priority, className = '' }) => {

    const getPriorityStyles = (p) => {
        switch (p?.toLowerCase()) {
            case 'high': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30';
            case 'low': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30';
            default: return 'bg-slate-50 text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800';
        }
    };

    const label = priority ? priority.toUpperCase() : 'NORMAL';

    return (
        <span className={`px-2 py-0.5 border rounded-lg text-[10px] font-bold uppercase tracking-widest ${getPriorityStyles(priority)} ${className}`}>
            {label}
        </span>
    );
};

export default PriorityBadge;
