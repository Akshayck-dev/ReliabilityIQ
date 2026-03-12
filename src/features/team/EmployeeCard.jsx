import React from 'react';
import { Mail, Briefcase, ChevronRight, BarChart2, Star } from 'lucide-react';

const EmployeeCard = ({ employee, onProfileClick }) => {
    const { name, email, designation, stats } = employee;
    const reliability = stats?.reliabilityScore || 0;

    const getReliabilityStyles = (score) => {
        if (score >= 90) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
        if (score >= 75) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
        return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800';
    };

    return (
        <div className="group bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/30 transition-all duration-300 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-all"></div>

            {/* Header: Avatar & Main Info */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/20 shrink-0">
                        {(name?.[0] || email?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="text-[17px] font-black text-slate-900 dark:text-white truncate leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {name || email?.split('@')[0]}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-1">
                            <Briefcase size={12} className="shrink-0" />
                            <span className="text-[12px] font-bold truncate">{designation || 'Specialist'}</span>
                        </div>
                    </div>
                </div>
                
                <div className={`px-2 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1 ${getReliabilityStyles(reliability)}`}>
                    <Star size={10} fill="currentColor" />
                    {reliability}%
                </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-5 px-1">
                <Mail size={12} className="shrink-0" />
                <span className="text-[11px] font-medium truncate">{email}</span>
            </div>

            {/* Minimal Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Assigned</p>
                    <p className="text-[16px] font-black text-slate-800 dark:text-slate-200">{stats?.assigned || 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800/60">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Completed</p>
                    <p className="text-[16px] font-black text-emerald-600 dark:text-emerald-400">{stats?.completed || 0}</p>
                </div>
            </div>

            {/* Actions */}
            <button 
                onClick={() => onProfileClick?.(employee)}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-[12px] font-black flex items-center justify-center gap-2 transition-all"
            >
                <BarChart2 size={14} />
                View Full Performance
                <ChevronRight size={14} />
            </button>
        </div>
    );
};

export default EmployeeCard;
