import React from 'react';
import { 
    ShieldCheck, 
    Zap, 
    TrendingUp, 
    Users, 
    Clock, 
    Star 
} from 'lucide-react';

const AnalyticsStats = ({ stats }) => {
    // These stats are derived from the aggregated data passed from the parent
    const statCards = [
        {
            label: 'Team Reliability',
            value: `${stats.avgReliability}%`,
            description: 'Overall on-time completion',
            icon: ShieldCheck,
            color: 'from-emerald-500 to-teal-600',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10'
        },
        {
            label: 'Peak Productivity',
            value: stats.peakHour || '11 AM',
            description: 'Highest active time',
            icon: Zap,
            color: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-50 dark:bg-blue-500/10'
        },
        {
            label: 'Top Category',
            value: stats.topCategory || 'Research',
            description: 'Highest output volume',
            icon: Star,
            color: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50 dark:bg-amber-500/10'
        },
        {
            label: 'Task Velocity',
            value: `${stats.avgCompletionDays}d`,
            description: 'Avg. turnaround time',
            icon: Clock,
            color: 'from-purple-500 to-pink-600',
            bg: 'bg-purple-50 dark:bg-purple-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, idx) => (
                <div 
                    key={idx}
                    className="relative group overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300"
                >
                    {/* Background Accent */}
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br ${stat.color}`} />
                    
                    <div className="relative flex flex-col gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                            <stat.icon size={20} className={`bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ stroke: 'url(#gradient-stat)' }} />
                            <svg width="0" height="0">
                                <linearGradient id="gradient-stat" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </svg>
                        </div>
                        
                        <div>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {stat.value}
                                </h3>
                                {stat.trend && (
                                    <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-0.5">
                                        <TrendingUp size={10} /> +{stat.trend}%
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                                {stat.description}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AnalyticsStats;
