import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { taskService } from '../../services/taskService';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip,
    LineChart, Line, ResponsiveContainer
} from 'recharts';
import {
    AlertOctagon, ThumbsUp, Clock, Lightbulb,
    AlertCircle, RefreshCw, TrendingUp, TrendingDown, Minus, Activity
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { FullPageSpinner } from '../../components/ui/Spinner';

/* ─── Shared Sub-components ─────────────────────────────────────────────── */

const Sparkline = ({ color }) => {
    const seed = color.charCodeAt(1) % 5;
    const data = [
        { v: 60 + seed * 4 }, { v: 55 + seed * 3 }, { v: 70 + seed * 2 },
        { v: 65 + seed * 5 }, { v: 80 + seed * 3 }, { v: 75 + seed * 4 }
    ];
    return (
        <ResponsiveContainer width={80} height={32}>
            <LineChart data={data}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
};

const CategoryIcon = ({ name, color }) => {
    const icons = { Frontend: '🎨', Development: '</>', Database: '🗄', Research: '🔍', Documentation: '📄', Meetings: '👥', Admin: '⚙' };
    return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[13px] font-bold shrink-0" style={{ background: `${color}20`, color }}>{icons[name] || '📌'}</span>;
};

const TrendIcon = ({ value }) => {
    if (value >= 90) return <TrendingUp size={14} className="text-green-500" />;
    if (value < 70) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-slate-400" />;
};

const HBar = ({ value, color }) => (
    <div className="relative h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-700 dark:text-slate-200">{value}</span>
    </div>
);

/* ─── Heatmap Cell Color ────────────────────────────────────────────────── */
const intensityToColor = (intensity) => {
    if (intensity === 0) return { bg: '#dbeafe', opacity: 0.3 };  // lightest blue
    if (intensity < 25) return { bg: '#93c5fd', opacity: 0.5 };
    if (intensity < 50) return { bg: '#60a5fa', opacity: 0.7 };
    if (intensity < 75) return { bg: '#3b82f6', opacity: 0.85 };
    return { bg: '#1e40af', opacity: 1 };                          // peak — deep navy
};

const DISPLAY_HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'];
const DISPLAY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ─── Heatmap Tab Content ────────────────────────────────────────────────── */
const HeatmapTab = ({ heatData }) => {
    const [hovered, setHovered] = useState(null);

    if (!heatData) {
        return (
            <div className="flex flex-col items-center justify-center h-72 text-center">
                <Activity size={30} className="text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No task timestamp data available yet.<br />Create and complete tasks to populate the heatmap.</p>
            </div>
        );
    }

    const { cells, insights } = heatData;

    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-5">

                {/* Heatmap Card */}
                <Card className="flex-1 p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
                    <div className="min-w-[600px]">
                        {/* Hour Labels */}
                        <div className="flex mb-2 pl-[46px]">
                            {DISPLAY_HOURS.map(h => (
                                <div key={h} className="flex-1 text-center text-[11px] font-medium text-slate-400 whitespace-nowrap">{h}</div>
                            ))}
                        </div>

                        {/* Grid rows */}
                        <div className="flex flex-col gap-1.5">
                            {cells.map((row, ri) => (
                                <div key={row.day} className="flex items-center gap-1.5">
                                    {/* Day label */}
                                    <span className="w-[40px] text-right text-[12px] font-medium text-slate-500 dark:text-slate-400 shrink-0 pr-1">
                                        {DISPLAY_DAYS[ri]}
                                    </span>
                                    {/* Hour cells */}
                                    {row.hours.map(cell => {
                                        const { bg, opacity } = intensityToColor(cell.intensity);
                                        const isHov = hovered?.day === row.day && hovered?.hour === cell.hour;
                                        return (
                                            <div
                                                key={cell.hour}
                                                onMouseEnter={() => setHovered({ day: row.day, hour: cell.hour, count: cell.count, dayLabel: DISPLAY_DAYS[ri], hourLabel: DISPLAY_HOURS[cell.hour - 8] })}
                                                onMouseLeave={() => setHovered(null)}
                                                className="flex-1 relative"
                                                style={{ minWidth: 32 }}
                                            >
                                                <div
                                                    className={`w-full h-8 rounded-md cursor-pointer transition-all duration-150 ${isHov ? 'ring-2 ring-blue-500 ring-offset-1 scale-105' : ''}`}
                                                    style={{ background: bg, opacity }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* X-axis label */}
                        <p className="text-center text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-4">Time of Day</p>

                        {/* Tooltip */}
                        {hovered && (
                            <div className="mt-3 text-center">
                                <span className="inline-block bg-slate-800 dark:bg-slate-700 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg">
                                    {hovered.dayLabel} {hovered.hourLabel} — {hovered.count} event{hovered.count !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-3 mt-5">
                            <span className="text-[11px] text-slate-400 font-medium">Low Activity</span>
                            <div className="flex gap-1">
                                {[0.25, 0.45, 0.65, 0.85, 1].map((op, i) => (
                                    <div key={i} className="w-8 h-3 rounded-sm" style={{ background: '#3b82f6', opacity: op }} />
                                ))}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">Peak Performance</span>
                        </div>
                    </div>
                </Card>

                {/* Insights Panel */}
                <Card className="w-full lg:w-64 p-5 border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10 shadow-sm flex flex-col shrink-0">
                    <h3 className="text-[14px] font-bold text-slate-800 dark:text-white mb-4">Peak Performance Insights</h3>
                    <ul className="flex flex-col gap-3 flex-1">
                        {insights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5 shrink-0" />
                                <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            {/* Y-axis label (vertical text via CSS) */}
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 -mt-4 pl-1">
                ↑ Days of the Week
            </p>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Performance Component                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
const Performance = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Category analytics state
    const [catData, setCatData] = useState(null);
    const [catLoading, setCatLoading] = useState(true);
    const [catError, setCatError] = useState(null);

    // Heatmap state
    const [heatData, setHeatData] = useState(null);
    const [heatLoading, setHeatLoading] = useState(false);
    const [heatError, setHeatError] = useState(null);

    /* ── Fetch Category Analytics ── */
    useEffect(() => {
        if (!user?.id) return;
        const load = async () => {
            setCatLoading(true);
            setCatError(null);
            try {
                const result = await taskService.getTaskCategoryAnalytics(user.id);
                setCatData(result);
            } catch (err) {
                setCatError(err.message || 'Failed to load analytics.');
            } finally {
                setCatLoading(false);
            }
        };
        load();
    }, [user?.id]);

    /* ── Fetch Heatmap (lazy — only when tab is switched) ── */
    useEffect(() => {
        if (activeTab !== 'heatmap' || !user?.id || heatData || heatError) return;
        const load = async () => {
            setHeatLoading(true);
            setHeatError(null);
            try {
                const result = await taskService.getTaskHeatmapData(user.id);
                setHeatData(result);
            } catch (err) {
                setHeatError(err.message || 'Failed to load heatmap.');
            } finally {
                setHeatLoading(false);
            }
        };
        load();
    }, [activeTab, user?.id, heatData, heatError]);

    /* ── Shared Error Block ── */
    const ErrorBlock = ({ msg, onRetry }) => (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 rounded-xl max-w-lg mx-auto mt-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertCircle size={24} /></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{msg}</p>
            <button onClick={onRetry} className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                <RefreshCw size={16} /> Retry
            </button>
        </div>
    );

    if (catLoading) return <FullPageSpinner message="Analyzing task categories..." />;
    if (catError) return <ErrorBlock msg={catError} onRetry={() => { setCatLoading(true); setCatError(null); }} />;

    const sortedByReliability = catData ? [...catData.Categories].sort((a, b) => b.reliabilityScore - a.reliabilityScore) : [];

    return (
        <div className="flex flex-col gap-5 max-w-[1200px] w-full pb-12 animate-fade-in">

            {/* ── Page Header ── */}
            <div>
                <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">Analytics</h1>
                {activeTab === 'heatmap' && (
                    <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-0.5">Analytics deep-dive into team productivity patterns.</p>
                )}
            </div>

            {/* ── Tab Bar ── */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 -mt-1">
                {[
                    { key: 'overview', label: 'Category Overview' },
                    { key: 'heatmap', label: 'Productivity Heatmap' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative px-5 py-3 text-[14px] font-semibold transition-colors focus:outline-none ${activeTab === tab.key
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.key && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* ══ CATEGORY OVERVIEW TAB ══ */}
            {activeTab === 'overview' && (
                <>
                    {!catData ? (
                        <div className="flex flex-col items-center justify-center h-72 text-center">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No task data yet. Create some tasks to see analytics.</p>
                        </div>
                    ) : (
                        <>
                            {/* Top 3 Metric Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <Card className="px-6 py-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0"><AlertOctagon size={22} className="text-red-500" /></div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Most Delayed Category</p>
                                        <p className="text-[22px] font-bold text-red-600 dark:text-red-400 leading-tight mt-0.5">{catData.mostDelayed}</p>
                                        <p className="text-[12px] text-slate-400 mt-0.5">Based on avg. delay</p>
                                    </div>
                                </Card>
                                <Card className="px-6 py-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0"><ThumbsUp size={22} className="text-teal-500" /></div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Most Reliable Category</p>
                                        <p className="text-[22px] font-bold text-teal-600 dark:text-teal-400 leading-tight mt-0.5">{catData.mostReliable}</p>
                                        <p className="text-[12px] text-slate-400 mt-0.5">{catData.mostReliableScore}% on-time rate</p>
                                    </div>
                                </Card>
                                <Card className="px-6 py-5 flex items-center gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0"><Clock size={22} className="text-blue-500" /></div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Average Completion Time</p>
                                        <p className="text-[22px] font-bold text-blue-600 dark:text-blue-400 leading-tight mt-0.5">{catData.avgCompletionDays} days</p>
                                        <p className="text-[12px] text-slate-400 mt-0.5">From creation → done</p>
                                    </div>
                                </Card>
                            </div>

                            {/* Donut | HBars | Insights */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Donut */}
                                <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                                    <h2 className="text-[15px] font-bold text-slate-800 dark:text-white mb-4">Task Type Distribution</h2>
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="w-full" style={{ height: 200 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={catData.distribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value" labelLine={false}>
                                                        {catData.distribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(val, name) => [`${val} tasks`, name]} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-1 w-full">
                                            {catData.distribution.map(item => (
                                                <div key={item.name} className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: item.color }} />
                                                    <span className="text-[12px] text-slate-600 dark:text-slate-300 flex-1">{item.name}</span>
                                                    <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">({item.pct}%)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* HBars */}
                                <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                                    <h2 className="text-[15px] font-bold text-slate-800 dark:text-white mb-1">Reliability by Task Category</h2>
                                    <p className="text-[12px] text-slate-400 mb-5">(Performance Score / 100)</p>
                                    <div className="flex flex-col gap-3 flex-1 justify-center">
                                        {sortedByReliability.map(cat => (
                                            <div key={cat.name} className="grid grid-cols-[90px_1fr] items-center gap-3">
                                                <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                                                <HBar value={cat.reliabilityScore} color={cat.color} />
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Insights */}
                                <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col bg-amber-50/50 dark:bg-amber-900/10">
                                    <div className="flex items-center gap-2 mb-5">
                                        <Lightbulb size={18} className="text-amber-500" />
                                        <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Efficiency Insights</h2>
                                    </div>
                                    <div className="flex flex-col gap-4 flex-1">
                                        {catData.insights.map((insight, i) => {
                                            const icons = [
                                                <TrendingDown key={0} size={16} className="text-orange-500 shrink-0 mt-0.5" />,
                                                <TrendingUp key={1} size={16} className="text-green-500 shrink-0 mt-0.5" />,
                                                <TrendingUp key={2} size={16} className="text-blue-500 shrink-0 mt-0.5" />,
                                                <Minus key={3} size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                            ];
                                            return (
                                                <div key={i} className="flex items-start gap-3">
                                                    {icons[i % icons.length]}
                                                    <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>

                            {/* Category Performance Table */}
                            <Card className="p-0 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                    <h2 className="text-[15px] font-bold text-slate-800 dark:text-white">Task Category Performance Details</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                {['Task Category', 'Avg Delay (Days)', 'Completion Rate (%)', 'Trend'].map(h => (
                                                    <th key={h} className="px-6 py-3 text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {catData.Categories.map(cat => (
                                                <tr key={cat.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-6 py-3.5"><div className="flex items-center gap-2.5"><CategoryIcon name={cat.name} color={cat.color} /><span className="text-[14px] font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span></div></td>
                                                    <td className="px-6 py-3.5"><span className={`text-[14px] font-medium ${cat.avgDelayDays > 1 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>{cat.avgDelayDays > 0 ? `${cat.avgDelayDays} days` : '—'}</span></td>
                                                    <td className="px-6 py-3.5"><div className="flex items-center gap-2"><span className="text-[14px] font-medium text-slate-700 dark:text-slate-300">{cat.completionRate}%</span><TrendIcon value={cat.completionRate} /></div></td>
                                                    <td className="px-6 py-3.5"><Sparkline color={cat.color} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </>
            )}

            {/* ══ HEATMAP TAB ══ */}
            {activeTab === 'heatmap' && (
                heatLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-sm text-slate-500">Mapping productivity patterns...</p>
                        </div>
                    </div>
                ) : heatError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <AlertCircle size={24} className="text-red-500 mb-3" />
                        <p className="text-slate-500 text-sm mb-4">{heatError}</p>
                        <button onClick={() => { setHeatError(null); setHeatData(null); }} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold"><RefreshCw size={14} /> Retry</button>
                    </div>
                ) : (
                    <HeatmapTab heatData={heatData} />
                )
            )}
        </div>
    );
};

export default Performance;
