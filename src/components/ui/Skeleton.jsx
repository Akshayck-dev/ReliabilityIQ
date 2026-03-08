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

export const ListTaskRowSkeleton = () => {
    return (
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 pointer-events-none flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <div className="flex gap-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 rounded-md" />
            </div>
        </div>
    );
};

export const TableTaskRowSkeleton = () => {
    return (
        <tr className="border-b border-slate-100 dark:border-slate-800/50 pointer-events-none text-left">
            <td className="p-6 w-1/4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
            </td>
            <td className="p-6">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
            </td>
            <td className="p-6">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
            </td>
            <td className="p-6">
                <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td className="p-6">
                <Skeleton className="h-6 w-24 rounded-md" />
            </td>
            <td className="p-6">
                <Skeleton className="h-6 w-16 rounded-full" />
            </td>
            <td className="p-6">
                <Skeleton className="h-8 w-24 rounded-md" />
            </td>
        </tr>
    );
};

export const AnalyticsRowSkeleton = () => {
    return (
        <tr className="border-b border-slate-100 dark:border-slate-800/50 pointer-events-none text-left">
            <td className="px-6 py-4">
                <Skeleton className="h-4 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/3" />
            </td>
            <td className="px-6 py-4">
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </td>
            <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                <Skeleton className="h-4 w-10 text-right" />
                <Skeleton className="h-2 w-32 rounded-full" />
            </td>
        </tr>
    );
};
