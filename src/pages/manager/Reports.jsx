import React, { useState, useEffect } from 'react';
import { FileDown, BarChart2, PieChart as PieChartIcon, Award, AlertCircle, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import { taskService } from '../../services/taskService';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { FullPageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { useAuth } from '../../features/auth/AuthContext';

const COLORS = {
    pending: '#94a3b8',      // slate-400
    in_progress: '#3b82f6',  // blue-500
    completed: '#22c55e',    // green-500
    high: '#ef4444',         // red-500
    medium: '#f97316',       // orange-500
    low: '#e2e8f0'           // slate-200
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg rounded-lg p-3 text-sm flex flex-col gap-1">
                <span className="font-bold text-slate-800 dark:text-slate-100">{payload[0].name}</span>
                <span className="text-slate-600 dark:text-slate-400">Count: <span className="font-semibold text-slate-900 dark:text-white">{payload[0].value}</span></span>
            </div>
        );
    }
    return null;
};

const Reports = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [tasksData, statsData] = await Promise.all([
                taskService.getAllTasks(user?.id),
                taskService.getEmployeeReliabilityStats(user?.id)
            ]);
            setTasks(tasksData || []);
            setStats(statsData || []);
        } catch (err) {
            console.error("Failed to fetch reports data:", err);
            setError(err.message || "Failed to load report data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExportCSV = () => {
        if (tasks.length === 0) {
            toast.error("No data available to export.");
            return;
        }
        setIsExporting(true);
        try {
            // Define headers
            const headers = ['Task ID', 'Title', 'Status', 'Priority', 'Assignee Email', 'Creator Email', 'Created At', 'Due Date', 'Completed At'];

            // Map data
            const rows = tasks.map(t => [
                t.id,
                `"${(t.title || '').replace(/"/g, '""')}"`, // Escape quotes
                t.status,
                t.priority,
                t.assignee?.email || t.assigned_to || '',
                t.creator?.email || t.manager_id || '',
                t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
                t.due_date ? format(new Date(t.due_date), 'yyyy-MM-dd HH:mm:ss') : '',
                t.completed_at ? format(new Date(t.completed_at), 'yyyy-MM-dd HH:mm:ss') : ''
            ]);

            // Combine
            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            // Trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `reliability_iq_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Report downloaded successfully.");
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Failed to generate report.");
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) return <FullPageSpinner message="Compiling reports data..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load reports</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-4 focus:ring-slate-100"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    // Process Status Data for Pie Chart
    const statusCounts = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
    }, {});
    const statusData = [
        { name: 'Pending', value: statusCounts['pending'] || 0, color: COLORS.pending },
        { name: 'In Progress', value: statusCounts['in_progress'] || 0, color: COLORS.in_progress },
        { name: 'Completed', value: statusCounts['completed'] || 0, color: COLORS.completed }
    ].filter(item => item.value > 0);

    // Process Priority Data for Bar Chart
    const priorityCounts = tasks.reduce((acc, task) => {
        const p = task.priority || 'medium';
        acc[p] = (acc[p] || 0) + 1;
        return acc;
    }, {});

    const priorityData = [
        { name: 'High', count: priorityCounts['high'] || 0, fill: COLORS.high },
        { name: 'Medium', count: priorityCounts['medium'] || 0, fill: COLORS.medium },
        { name: 'Low', count: priorityCounts['low'] || 0, fill: '#cbd5e1' } // slate-300 for visibility
    ];

    // Process Top Performers
    const topPerformers = [...stats]
        .filter(s => s.totalAssigned > 0) // Must have tasks to be ranked
        .sort((a, b) => b.reliability - a.reliability || b.completed - a.completed)
        .slice(0, 3);

    return (
        <div className="flex flex-col h-full max-w-[1200px] w-full animate-fade-in pb-12">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">Data Reports</h1>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">Generate and download comprehensive performance data.</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={isExporting || tasks.length === 0}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDown size={18} />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1: Status Distribution */}
                <Card className="p-6 col-span-1 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChartIcon size={20} className="text-blue-600 dark:text-blue-500" />
                        <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Task Status Volume</h2>
                    </div>
                    {statusData.length > 0 ? (
                        <div className="flex-1 min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{tasks.length}</span>
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <EmptyState
                                icon={PieChartIcon}
                                title="No Status Data"
                                description="There are no tasks to analyze."
                            />
                        </div>
                    )}
                </Card>

                {/* Column 2: Priority Metrics */}
                <Card className="p-6 col-span-1 lg:col-span-2 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 size={20} className="text-blue-600 dark:text-blue-500" />
                        <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Priority Distribution</h2>
                    </div>
                    {tasks.length > 0 ? (
                        <div className="flex-1 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={priorityData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dx={-10}
                                        allowDecimals={false}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <EmptyState
                                icon={BarChart2}
                                title="No Priority Data"
                                description="There are no tasks to analyze."
                            />
                        </div>
                    )}
                </Card>

                {/* Column 3: Top Performers Leaderboard */}
                <Card className="p-0 col-span-1 lg:col-span-3 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-2">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                            <Award size={20} className="text-[#fbbd23]" />
                            <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Performance Leaderboard</h2>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Top 3 Most Reliable</span>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-950 p-6">
                        {topPerformers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {topPerformers.map((performer, idx) => {
                                    const medals = ['text-[#fbbd23]', 'text-slate-400', 'text-[#cd7f32]'];
                                    const medalBg = ['bg-yellow-50', 'bg-slate-100', 'bg-amber-50'];
                                    const medalBorders = ['border-yellow-200', 'border-slate-200', 'border-amber-200'];

                                    return (
                                        <div key={performer.id} className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)] relative overflow-hidden group">
                                            {/* Rank Badge */}
                                            <div className={`absolute top-0 right-0 w-12 h-12 flex items-start justify-end p-2 ${medalBg[idx]}`}>
                                                <div className="absolute top-0 right-0 w-10 h-10 bg-white dark:bg-slate-900 rotate-45 translate-x-5 -translate-y-5"></div>
                                                <span className={`text-[15px] font-extrabold relative z-10 ${medals[idx]}`}>#{idx + 1}</span>
                                            </div>

                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border-2 ${medalBorders[idx]} bg-slate-50 dark:bg-slate-800 dark:text-slate-200`}>
                                                    {performer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{performer.name}</h3>
                                                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">{performer.email}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Reliability</p>
                                                    <p className={`text-xl font-bold ${performer.reliability >= 80 ? 'text-green-600 dark:text-green-500' : performer.reliability >= 50 ? 'text-amber-500' : 'text-red-600 dark:text-red-500'}`}>
                                                        {performer.reliability}%
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Completed</p>
                                                    <p className="text-xl font-bold text-slate-900 dark:text-white">{performer.completed}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-2">
                                <EmptyState
                                    icon={Award}
                                    title="No performance data available yet"
                                    description="Assign and complete tasks to generate the leaderboard."
                                />
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default Reports;
