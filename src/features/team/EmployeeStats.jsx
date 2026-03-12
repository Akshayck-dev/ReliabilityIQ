import React from 'react';
import { Users, Activity, Target, ShieldCheck } from 'lucide-react';

const EmployeeStats = ({ teamMembers = [] }) => {
    const totalMembers = teamMembers.length;
    const totalTasks = teamMembers.reduce((acc, emp) => acc + (emp.stats?.assigned || 0), 0);
    const avgReliability = teamMembers.length > 0 
        ? Math.round(teamMembers.reduce((acc, emp) => acc + (emp.stats?.reliabilityScore || 0), 0) / teamMembers.length)
        : 0;
    const completedTasks = teamMembers.reduce((acc, emp) => acc + (emp.stats?.completed || 0), 0);

    const stats = [
        {
            label: 'Total Team',
            value: totalMembers,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800'
        },
        {
            label: 'Active Workload',
            value: totalTasks,
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-100 dark:border-amber-800'
        },
        {
            label: 'Team Reliability',
            value: `${avgReliability}%`,
            icon: ShieldCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-100 dark:border-emerald-800'
        },
        {
            label: 'Total Completed',
            value: completedTasks,
            icon: Target,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            border: 'border-indigo-100 dark:border-indigo-800'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
                <div 
                    key={i} 
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border ${stat.border} shadow-sm transition-all hover:shadow-md group`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                            <stat.icon size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Team Metric</span>
                    </div>
                    <div>
                        <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">{stat.label}</p>
                        <h3 className="text-[24px] font-black text-slate-900 dark:text-white leading-tight">
                            {stat.value}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EmployeeStats;
