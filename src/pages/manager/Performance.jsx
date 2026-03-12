import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { taskService } from '../../services/taskService';
import { 
    Activity, 
    LayoutDashboard, 
    Users, 
    Zap, 
    AlertCircle, 
    RefreshCw,
    Search,
    Filter
} from 'lucide-react';
import { FullPageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';

// Modular Components
import AnalyticsStats from '../../features/analytics/AnalyticsStats';
import CategoryDistribution from '../../features/analytics/CategoryDistribution';
import TeamPerformanceGrid from '../../features/analytics/TeamPerformanceGrid';
import AIInsights from '../../features/analytics/AIInsights';

/* ─── Heatmap Sub-components ────────────────────────────────────────────── */
const intensityToColor = (intensity) => {
    if (intensity === 0) return { bg: '#e2e8f0', opacity: 0.2 }; 
    if (intensity < 25) return { bg: '#93c5fd', opacity: 0.4 };
    if (intensity < 50) return { bg: '#60a5fa', opacity: 0.6 };
    if (intensity < 75) return { bg: '#3b82f6', opacity: 0.8 };
    return { bg: '#1d4ed8', opacity: 1 };
};

const DISPLAY_HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'];
const DISPLAY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HeatmapTab = ({ heatData }) => {
    const [hovered, setHovered] = useState(null);

    if (!heatData) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center animate-fade-in bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center mb-4">
                    <Activity size={32} className="text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Low Activity Threshold</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mt-2">Create and complete more tasks to reveal your team's unique productivity fingerprints.</p>
            </div>
        );
    }

    const { cells, insights } = heatData;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-6">
                <Card className="flex-1 p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                    <div className="min-w-[700px]">
                        <div className="flex mb-4 pl-[46px]">
                            {DISPLAY_HOURS.map(h => (
                                <div key={h} className="flex-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">{h}</div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2">
                            {cells.map((row, ri) => (
                                <div key={row.day} className="flex items-center gap-2">
                                    <span className="w-[40px] text-right text-[11px] font-bold text-slate-500 uppercase shrink-0 pr-2">
                                        {DISPLAY_DAYS[ri]}
                                    </span>
                                    {row.hours.map(cell => {
                                        const { bg, opacity } = intensityToColor(cell.intensity);
                                        const isHov = hovered?.day === row.day && hovered?.hour === cell.hour;
                                        return (
                                            <div
                                                key={cell.hour}
                                                onMouseEnter={() => setHovered({ 
                                                    dayLabel: DISPLAY_DAYS[ri], 
                                                    hourLabel: DISPLAY_HOURS[cell.hour - 8],
                                                    count: cell.count 
                                                })}
                                                onMouseLeave={() => setHovered(null)}
                                                className="flex-1 relative"
                                            >
                                                <div
                                                    className={`w-full h-10 rounded-lg cursor-pointer transition-all duration-300 ${isHov ? 'shadow-lg ring-2 ring-blue-500/50 scale-105 z-10' : 'hover:scale-105'}`}
                                                    style={{ background: bg, opacity: 0.1 + opacity * 0.9 }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-8 px-10">
                            <div className="flex items-center gap-4">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Efficiency Gradient</span>
                                <div className="flex gap-1.5">
                                    {[0.1, 0.3, 0.5, 0.7, 0.9, 1].map((op, i) => (
                                        <div key={i} className="w-8 h-2.5 rounded-full" style={{ background: '#3b82f6', opacity: op }} />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="h-10 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                {hovered ? (
                                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                                        {hovered.dayLabel} at {hovered.hourLabel}: <span className="text-blue-600 dark:text-blue-400">{hovered.count} events</span>
                                    </span>
                                ) : (
                                    <span className="text-[11px] font-medium text-slate-400 italic">Hover to explore time-blocks</span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="w-full lg:w-[320px] p-6 border-none bg-gradient-to-br from-blue-600 to-indigo-700 shadow-xl shadow-blue-500/20 text-white shrink-0">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap size={20} className="text-amber-300 fill-amber-300" />
                        <h3 className="text-[16px] font-black uppercase tracking-wider">Pattern Analysis</h3>
                    </div>
                    <div className="space-y-6">
                        {insights.map((insight, i) => (
                            <div key={i} className="relative pl-6">
                                <div className="absolute left-0 top-1 w-1.5 h-1.5 rounded-full bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                                <p className="text-[13px] font-medium leading-relaxed text-blue-50">{insight}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

/* ─── Main Component ────────────────────────────────────────────────────── */
const Performance = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    
    // Combined Data State
    const [data, setData] = useState({
        categories: null,
        team: [],
        heatmap: null,
        loading: true,
        error: null
    });

    const fetchData = async () => {
        if (!user?.id) return;
        setData(prev => ({ ...prev, loading: true, error: null }));
        try {
            const [catResult, teamResult, heatResult] = await Promise.all([
                taskService.getTaskCategoryAnalytics(user.id),
                taskService.getEmployeeReliabilityStats(user.id),
                taskService.getTaskHeatmapData(user.id)
            ]);
            setData({
                categories: catResult,
                team: teamResult || [],
                heatmap: heatResult,
                loading: false,
                error: null
            });
        } catch (err) {
            setData(prev => ({ ...prev, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const aggregatedMetrics = useMemo(() => {
        if (!data.team.length || !data.categories) return {};

        const totalTasks = data.team.reduce((acc, curr) => acc + curr.totalAssigned, 0);
        const totalCompletedOnTime = data.team.reduce((acc, curr) => acc + curr.onTime, 0);
        const avgReliability = totalTasks > 0 ? Math.round((totalCompletedOnTime / totalTasks) * 100) : 0;

        return {
            avgReliability,
            avgCompletionDays: data.categories.avgCompletionDays,
            topCategory: data.categories.mostReliable,
            peakHour: data.heatmap?.insights[0]?.match(/\d+ (AM|PM)/)?.[0] || '11 AM'
        };
    }, [data]);

    if (data.loading) return <FullPageSpinner message="Compiling performance analytics..." />;

    const tabs = [
        { id: 'overview', label: 'Categorical', icon: LayoutDashboard },
        { id: 'team', label: 'Team Reliability', icon: Users },
        { id: 'heatmap', label: 'Productivity Map', icon: Activity }
    ];

    return (
        <div className="flex flex-col gap-6 max-w-[1240px] w-full pb-16 animate-fade-in px-4 md:px-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence Dashboard</h1>
                    <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                        High-precision metrics and behavioral insights.
                    </p>
                </div>
                
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-300 ${
                                activeTab === tab.id 
                                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-700/50 outline-none'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* AI Intelligence Insights Center */}
            <AIInsights data={data} />

            {/* Global Stats Row */}
            <AnalyticsStats stats={aggregatedMetrics} />

            {/* Tab Panels */}
            <div className="mt-2">
                {activeTab === 'overview' && (
                    <div className="animate-fade-in">
                        <CategoryDistribution catData={data.categories} />
                        
                        {/* Insights & Table Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            <Card className="lg:col-span-2 noPadding border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                                    <h2 className="text-[14px] font-black uppercase text-slate-800 dark:text-white tracking-widest">Turnaround breakdown</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700">
                                                <th className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                                <th className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Avg. Completion</th>
                                                <th className="px-6 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {data.categories.Categories.map(cat => (
                                                <tr key={cat.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>•</div>
                                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{cat.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[13px] font-semibold text-slate-600 dark:text-slate-300">
                                                            {cat.avgDelayDays > 0 ? `${cat.avgDelayDays}d turn` : 'Same day'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-[12px] font-black px-2 py-0.5 rounded-full ${
                                                            cat.completionRate >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                            {cat.completionRate}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            <Card className="p-6 bg-slate-900 border-none relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-10 blur-3xl -mr-16 -mt-16" />
                                <div className="relative z-10 h-full flex flex-col">
                                    <h3 className="text-[14px] font-black text-blue-400 uppercase tracking-widest mb-6">Manager insights</h3>
                                    <div className="space-y-6 flex-1">
                                        {data.categories.insights.slice(0, 3).map((insight, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center shrink-0">
                                                    <span className="text-[11px] font-black text-slate-600">0{i+1}</span>
                                                </div>
                                                <p className="text-[13px] text-slate-400 leading-relaxed font-medium pt-1 italic">
                                                    "{insight}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="mt-8 w-full py-3 bg-slate-800 hover:bg-slate-750 text-blue-400 text-[12px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700/50">
                                        Generate Full Report
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="animate-fade-in">
                        <TeamPerformanceGrid stats={data.team} />
                    </div>
                )}

                {activeTab === 'heatmap' && (
                    <HeatmapTab heatData={data.heatmap} />
                )}
            </div>
        </div>
    );
};

export default Performance;
