import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, trend = 'without trend', icon: Icon, valueSuffix = '', iconColor = 'text-slate-600 dark:text-slate-300', iconBg = 'bg-slate-100 dark:bg-slate-800', className = '' }) => {
    return (
        <Card className={`flex justify-between items-start ${className}`} noPadding>
            <div className="p-5">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 tracking-tight">{title}</h3>
                <div className="flex items-center gap-1 mt-1.5">
                    <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{value}</p>
                    {valueSuffix && <span className="text-xl font-medium text-slate-600 dark:text-slate-400 mt-1">{valueSuffix}</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tracking-tight">{trend}</p>
            </div>

            {Icon && (
                <div className="p-5 pb-0 pl-0">
                    <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm transition-colors`}>
                        <Icon strokeWidth={2} size={18} className={iconColor} />
                    </div>
                </div>
            )}
        </Card>
    );
};

export default StatCard;
