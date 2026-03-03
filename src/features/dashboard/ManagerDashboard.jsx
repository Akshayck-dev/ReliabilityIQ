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
    RefreshCw
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

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Due date alerts with 60s auto-refresh
    const dueCounts = useDueDateAlerts(tasks, user?.id, fetchStats);

    // Close filter dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilterMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-red-100 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to load data</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-4 focus:ring-slate-100"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    // Filter tasks by time range
    const filterStart = getFilterStartDate(timeFilter);
    const filteredTasks = filterStart
        ? tasks.filter(t => {
            const taskDate = new Date(t.created_at);
            return isAfter(taskDate, filterStart) || taskDate.getTime() === filterStart.getTime();
        })
        : tasks;

    const activeLabel = FILTER_OPTIONS.find(o => o.key === timeFilter)?.label || 'This Month';

    // Calculate aggregated metrics based on filtered tasks
    const totalTasks = filteredTasks.length;
    const completedTasksCount = filteredTasks.filter(t => t.status === 'completed').length;

    const totalAssigned = stats.reduce((sum, s) => sum + s.totalAssigned, 0);
    const completedOnTime = stats.reduce((sum, s) => sum + s.onTime, 0);
    const overallReliability = totalAssigned > 0 ? ((completedOnTime / totalAssigned) * 100).toFixed(1) : '0.0';

    const tableEmployees = stats
        .map(s => ({
            id: s.id,
            name: s.name || s.email?.split('@')[0] || 'Unknown User',
            assigned: s.totalAssigned || 0,
            completed: s.completed || 0,
            reliability: `${s.reliability || 0}%`,
            status: s.reliability >= 80 ? 'Good' : s.reliability >= 50 ? 'Moderate' : 'Poor'
        }));

    return (
        <div className="flex flex-col h-full min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">Team Analytics</h1>

                <div className="flex items-center gap-3">
                    {/* Time Filter Dropdown */}
                    <div className="relative" ref={filterRef}>
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            <Calendar size={18} className="text-slate-500 dark:text-slate-400" />
                            {activeLabel}
                            <ChevronDown size={16} className={`text-slate-400 ml-1 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showFilterMenu && (
                            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                                {FILTER_OPTIONS.map(opt => (
                                    <button
                                        key={opt.key}
                                        onClick={() => {
                                            setTimeFilter(opt.key);
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${timeFilter === opt.key
                                            ? 'bg-[#ea580c]/10 text-[#ea580c] dark:bg-orange-900/30 dark:text-orange-400 font-bold'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Task Button */}
                    <Link to="/assign-task" className="flex items-center gap-2 bg-[#fbbd23] hover:bg-[#f5b011] text-[#785601] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
                        <Plus size={18} />
                        Add Task
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Total Employees"
                            value={stats.length.toString()}
                            trend="Active team members"
                            icon={User}
                        />
                        <StatCard
                            title="Total Assigned"
                            value={totalTasks.toString()}
                            trend="Tasks globally assigned"
                            icon={ClipboardList}
                        />
                        <StatCard
                            title="Completed Tasks"
                            value={completedTasksCount.toString()}
                            trend="Successfully finished"
                            icon={Check}
                        />
                        <StatCard
                            title="Overdue"
                            value={dueCounts.overdue.toString()}
                            trend="Requires immediate action"
                            icon={AlertCircle}
                            iconColor="text-red-700 dark:text-red-400"
                            iconBg="bg-red-100 dark:bg-red-900/30"
                        />
                        <StatCard
                            title="Due Today"
                            value={dueCounts.dueToday.toString()}
                            trend="Tasks due today"
                            icon={Clock}
                            iconColor="text-amber-700 dark:text-amber-400"
                            iconBg="bg-amber-100 dark:bg-amber-900/30"
                        />
                        <StatCard
                            title="Due Soon"
                            value={dueCounts.dueSoon.toString()}
                            trend="Due within 2 days"
                            icon={AlertTriangle}
                            iconColor="text-blue-700 dark:text-blue-400"
                            iconBg="bg-blue-100 dark:bg-blue-900/30"
                        />
                        <StatCard
                            title="Overall Reliability"
                            value={overallReliability.toString()}
                            valueSuffix="%"
                            trend="Team on-time rate"
                            icon={Percent}
                            iconColor={overallReliability >= 80 ? 'text-green-700' : 'text-amber-600'}
                            iconBg={overallReliability >= 80 ? 'bg-green-100' : 'bg-amber-100'}
                        />
                    </>
                )}
            </div>

            {/* Split Content Area for Table and Chart */}
            <div className="mt-6 flex-1 flex flex-col lg:flex-row gap-6 items-stretch">
                {/* 65% Width Table */}
                <div className="w-full lg:w-[65%] shrink-0 flex flex-col">
                    <TaskTable employees={tableEmployees} loading={loading} />
                </div>

                {/* 35% Width Chart Panel */}
                <div className="w-full lg:w-[35%] flex flex-col">
                    <ErrorBoundary>
                        <TaskStatusChart tasks={filteredTasks} loading={loading} />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto py-6 flex items-center justify-center gap-6 text-[11px] font-semibold text-slate-500">
                <a href="#" className="hover:text-slate-800 transition-colors">About</a>
                <a href="#" className="hover:text-slate-800 transition-colors">Support</a>
                <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
                <span>© 2024 ReliabilityIQ</span>
            </footer>
        </div>
    );
};

export default ManagerDashboard;
