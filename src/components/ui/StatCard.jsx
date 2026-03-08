import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, trend = 'without trend', progress, progressText, icon: Icon, valueSuffix = '', iconColor = 'text-slate-600 dark:text-slate-300', iconBg = 'bg-slate-100 dark:bg-slate-800', className = '' }) => {
    return (
        <Card className={`flex flex-col justify-between ${className}`} noPadding>
            <div className="flex justify-between items-start">
                <div className="p-5">
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 tracking-tight">{title}</h3>
                    <div className="flex items-center gap-1 mt-1.5">
                        <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{value}</p>
                        {valueSuffix && <span className="text-xl font-medium text-slate-600 dark:text-slate-400 mt-1">{valueSuffix}</span>}
                    </div>
                    {progress === undefined && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tracking-tight">{trend}</p>}
                </div>

                {Icon && (
                    <div className="p-5 pb-0 pl-0 shrink-0">
                        <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors`}>
                            <Icon strokeWidth={2} size={18} className={iconColor} />
                        </div>
                    </div>
                )}
            </div>

            {progress !== undefined && (
                <div className="px-5 pb-5 mt-auto">
                    <div className="flex justify-between items-end mb-2 gap-2">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight truncate">{progressText || trend}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ease-out ${iconColor.replaceAll('text-', 'bg-')}`}
                            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </Card>
    );
};

export default StatCard;
