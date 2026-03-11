import React, { useEffect, useState, useCallback, useRef } from 'react';
import { taskService } from '../../services/taskService';
import StatCard from '../../components/ui/StatCard';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import TaskTable from './components/TaskTable';
import TaskStatusChart from './components/TaskStatusChart';
import ErrorBoundary from '../../components/ErrorBoundary';
import useDueDateAlerts from '../../hooks/useDueDateAlerts';
import {
    Calendar,
    ChevronDown,
    Plus,
    User,
    ClipboardList,
    Check,
    Percent,
    AlertCircle,
    Clock,
    AlertTriangle,
    RefreshCw,
    TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { startOfWeek, startOfMonth, startOfQuarter, isAfter } from 'date-fns';
import { useAuth } from '../../features/auth/AuthContext';

const FILTER_OPTIONS = [
    { key: 'this_week', label: 'This Week' },
    { key: 'this_month', label: 'This Month' },
    { key: 'this_quarter', label: 'This Quarter' },
    { key: 'all_time', label: 'All Time' }
];

const getFilterStartDate = (filterKey) => {
    const now = new Date();
    switch (filterKey) {
        case 'this_week': return startOfWeek(now, { weekStartsOn: 1 });
        case 'this_month': return startOfMonth(now);
        case 'this_quarter': return startOfQuarter(now);
        case 'all_time': return null;
        default: return startOfMonth(now);
    }
};

const ManagerDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeFilter, setTimeFilter] = useState('this_month');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const filterRef = useRef(null);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, tasksData] = await Promise.all([
                taskService.getEmployeeReliabilityStats(user?.id),
                taskService.getAllTasks(user?.id)
            ]);
            setStats(statsData || []);
            setTasks(tasksData || []);
        } catch (err) {
            console.error("Error fetching stats:", err);
            setError(err.message || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const dueCounts = useDueDateAlerts(tasks, user?.id, fetchStats);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load data</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
                >
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    const filterStart = getFilterStartDate(timeFilter);
    const filteredTasks = filterStart
        ? tasks.filter(t => {
            const taskDate = new Date(t.created_at);
            return isAfter(taskDate, filterStart) || taskDate.getTime() === filterStart.getTime();
        })
        : tasks;

    const activeLabel = FILTER_OPTIONS.find(o => o.key === timeFilter)?.label || 'This Month';
    const totalTasks = filteredTasks.length;
    const completedTasksCount = filteredTasks.filter(t => t.status === 'completed').length;
    const totalAssigned = stats.reduce((sum, s) => sum + s.totalAssigned, 0);
    const completedOnTime = stats.reduce((sum, s) => sum + s.onTime, 0);
    const overallReliability = totalAssigned > 0 ? ((completedOnTime / totalAssigned) * 100).toFixed(1) : '0.0';
    const hasUrgent = dueCounts.overdue > 0 || dueCounts.dueToday > 0;

    const tableEmployees = stats.map(s => ({
        id: s.id,
        name: s.name || s.email?.split('@')[0] || 'Unknown User',
        assigned: s.totalAssigned || 0,
        completed: s.completed || 0,
        reliability: `${s.reliability || 0}%`,
        status: s.reliability >= 80 ? 'Good' : s.reliability >= 50 ? 'Moderate' : 'Poor'
    }));

    return (
        <div className="flex flex-col h-full min-h-screen animate-fade-in">

            {/* ── Page Header ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">Team Analytics</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Monitor your team's performance and reliability.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Time Filter */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            <Calendar size={16} className="text-slate-400" />
                            {activeLabel}
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                        </button>
                        {showFilterMenu && (
                            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                                {FILTER_OPTIONS.map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => { setTimeFilter(opt.key); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${timeFilter === opt.key
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Task — brand blue, not orange */}
                    <Link
                        id="tour-add-task"
                        to="/assign-task"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Add Task
                    </Link>
                </div>
            </div>

            {/* ── Urgent Alert Banner ───────────────────────────────────── */}
            {!loading && hasUrgent && (
                <div className={`mb-6 px-4 py-3.5 rounded-xl border flex items-center gap-3 animate-fade-in ${dueCounts.overdue > 0
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${dueCounts.overdue > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
                        <AlertCircle size={16} />
                    </div>
                    <p className={`text-sm font-medium ${dueCounts.overdue > 0 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        {dueCounts.overdue > 0 && <><strong>{dueCounts.overdue} overdue task{dueCounts.overdue > 1 ? 's' : ''}</strong> require immediate action. </>}
                        {dueCounts.dueToday > 0 && <><strong>{dueCounts.dueToday} task{dueCounts.dueToday > 1 ? 's' : ''}</strong> due today.</>}
                    </p>
                </div>
            )}

            {/* ── Stat Cards — two rows for clarity ───────────────────── */}
            {/* Row 1: Core metrics (4 cards) */}
            <div id="tour-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {loading ? (
                    <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
                ) : (
                    <>
                        <StatCard
                            title="Team Members"
                            value={stats.length.toString()}
                            trend="Active employees"
                            icon={User}
                            iconColor="text-blue-600 dark:text-blue-400"
                            iconBg="bg-blue-50 dark:bg-blue-900/30"
                        />
                        <StatCard
                            title="Total Tasks"
                            value={totalTasks.toString()}
                            trend={`In ${activeLabel.toLowerCase()}`}
                            icon={ClipboardList}
                        />
                        <StatCard
                            title="Completed"
                            value={completedTasksCount.toString()}
                            trend="Successfully finished"
                            icon={Check}
                            progress={totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0}
                            progressText={`${completedTasksCount} of ${totalTasks} tasks`}
                            iconColor="text-green-600 dark:text-green-400"
                            iconBg="bg-green-50 dark:bg-green-900/30"
                        />
                        <StatCard
                            title="Reliability"
                            value={overallReliability.toString()}
                            valueSuffix="%"
                            trend="Team on-time rate"
                            icon={TrendingUp}
                            iconColor={parseFloat(overallReliability) >= 80 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}
                            iconBg={parseFloat(overallReliability) >= 80 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}
                        />
                    </>
                )}
            </div>

            {/* Row 2: Urgency metrics (3 cards, visually distinguished) */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {loading ? (
                    <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
                ) : (
                    <>
                        <StatCard
                            title="Overdue"
                            value={dueCounts.overdue.toString()}
                            trend="Requires immediate action"
                            icon={AlertCircle}
                            iconColor="text-red-600 dark:text-red-400"
                            iconBg="bg-red-50 dark:bg-red-900/30"
                        />
                        <StatCard
                            title="Due Today"
                            value={dueCounts.dueToday.toString()}
                            trend="Must be done today"
                            icon={Clock}
                            iconColor="text-amber-600 dark:text-amber-400"
                            iconBg="bg-amber-50 dark:bg-amber-900/30"
                        />
                        <StatCard
                            title="Due Soon"
                            value={dueCounts.dueSoon.toString()}
                            trend="Within the next 2 days"
                            icon={AlertTriangle}
                            iconColor="text-blue-600 dark:text-blue-400"
                            iconBg="bg-blue-50 dark:bg-blue-900/30"
                        />
                    </>
                )}
            </div>

            {/* ── Main Content: Table + Chart ───────────────────────────── */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch">
                <div className="w-full lg:w-[65%] shrink-0 flex flex-col">
                    <TaskTable employees={tableEmployees} loading={loading} />
                </div>
                <div className="w-full lg:w-[35%] flex flex-col">
                    <ErrorBoundary>
                        <TaskStatusChart tasks={filteredTasks} loading={loading} />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
