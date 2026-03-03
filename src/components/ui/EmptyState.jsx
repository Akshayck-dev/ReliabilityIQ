import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({
    // eslint-disable-next-line no-unused-vars
    icon: Icon = PackageOpen,
    title = 'No data found',
    description = 'There is currently no data to display here.',
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
                {description}
            </p>
            {action && (
                <div className="mt-2">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
