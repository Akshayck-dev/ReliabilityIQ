import React from 'react';
import { ClipboardList, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, trend }) => {
    const colorClasses = {
        blue: 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50',
        rose: 'bg-rose-50/50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/50',
        violet: 'bg-violet-50/50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800/50',
        emerald: 'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl border ${colorClasses[color]}`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {value}
                </h3>
            </div>
        </div>
    );
};

const TaskStats = ({ tasks = [] }) => {
    const active = tasks.filter(t => t.status !== 'completed').length;
    const overdue = tasks.filter(t => {
        if (t.status === 'completed' || !t.due_date) return false;
        return new Date(t.due_date) < new Date();
    }).length;
    const inReview = tasks.filter(t => t.status === 'review').length;
    const completedMonth = tasks.filter(t => {
        if (t.status !== 'completed' || !t.completed_at) return false;
        const completeDate = new Date(t.completed_at);
        const now = new Date();
        return completeDate.getMonth() === now.getMonth() && completeDate.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard 
                label="Active Tasks" 
                value={active} 
                icon={ClipboardList} 
                color="blue" 
                trend="Live"
            />
            <StatCard 
                label="Overdue" 
                value={overdue} 
                icon={AlertCircle} 
                color="rose" 
                trend={overdue > 0 ? 'Urgent' : null}
            />
            <StatCard 
                label="In Review" 
                value={inReview} 
                icon={Clock} 
                color="violet" 
                trend={inReview > 0 ? 'Attention' : null}
            />
            <StatCard 
                label="Month's Output" 
                value={completedMonth} 
                icon={CheckCircle2} 
                color="emerald" 
                trend="Completed"
            />
        </div>
    );
};

export default TaskStats;
