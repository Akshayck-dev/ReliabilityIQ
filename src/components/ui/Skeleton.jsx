import React from 'react';

export const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`}
            {...props}
        />
    );
};

export const StatCardSkeleton = () => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between pointer-events-none">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-end gap-3">
                    <Skeleton className="h-8 w-16" />
                </div>
            </div>
        </div>
    );
};

export const TaskRowSkeleton = () => {
    return (
        <tr className="border-b border-slate-100 dark:border-slate-800/50 pointer-events-none">
            <td className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </td>
            <td className="p-4">
                <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td className="p-4">
                <Skeleton className="h-6 w-16 rounded-full" />
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </td>
            <td className="p-4 text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
            </td>
        </tr>
    );
};
