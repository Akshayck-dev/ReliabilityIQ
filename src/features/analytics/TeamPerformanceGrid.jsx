import React from 'react';
import Card from '../../components/ui/Card';
import { Trophy, Activity, ArrowUpRight, ArrowDownRight, Minus, UserCheck } from 'lucide-react';

const TrendIcon = ({ value }) => {
    if (value >= 85) return <ArrowUpRight size={14} className="text-emerald-500" />;
    if (value < 65) return <ArrowDownRight size={14} className="text-red-500" />;
    return <Minus size={14} className="text-slate-400" />;
};

const TeamPerformanceGrid = ({ stats, loading }) => {
    const topPerformers = stats
        .filter(s => s.totalAssigned > 0)
        .sort((a, b) => b.reliability - a.reliability)
        .slice(0, 3);

    return (
        <div className="flex flex-col gap-6">
            {/* Top Performers Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {topPerformers.map((emp, idx) => (
                    <Card key={emp.id} className="p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-3 group">
                        {idx === 0 && (
                            <div className="absolute top-0 right-0 p-3">
                                <Trophy size={40} className="text-amber-100 dark:text-amber-900/20 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 text-xs border-2 border-white dark:border-slate-900 shadow-sm">
                                {emp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{emp.name}</h3>
                                <p className="text-[11px] text-slate-400 font-medium">Rank #{idx + 1}</p>
                            </div>
                        </div>
                        <div className="flex items-end justify-between mt-1">
                            <div>
                                <p className="text-[20px] font-black text-slate-900 dark:text-white leading-none">
                                    {emp.reliability}%
                                </p>
                                <p className="text-[11px] font-bold text-emerald-500 mt-1 uppercase tracking-tight">Reliability</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                    {emp.onTime} / {emp.totalAssigned}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium">On-time Completion</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Detailed Table */}
            <Card noPadding className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 flex items-center justify-between">
                    <div>
                        <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Active Team Reliability</h2>
                        <p className="text-[12px] text-slate-400 mt-0.5 font-medium">Performance data across all tracked members</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                                <th className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Efficiency</th>
                                <th className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {stats.map(emp => (
                                <tr key={emp.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                {emp.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{emp.name}</div>
                                                <div className="text-[11px] text-slate-400 font-medium">{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1.5 max-w-[180px]">
                                            <div className="flex justify-between items-center text-[11px] font-bold">
                                                <span className="text-slate-500 mb-0.5">{emp.reliability}% Score</span>
                                                <span className="text-slate-400">{emp.onTime} / {emp.totalAssigned}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-700 ${
                                                        emp.reliability >= 80 ? 'bg-emerald-500' :
                                                        emp.reliability >= 50 ? 'bg-amber-400' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${emp.reliability}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-600 shadow-sm">
                                            <TrendIcon value={emp.reliability} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TeamPerformanceGrid;
