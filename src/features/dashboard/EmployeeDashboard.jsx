import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { taskService } from '../../services/taskService';
import StatCard from '../../components/ui/StatCard';
import { FullPageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import { StatCardSkeleton } from '../../components/ui/Skeleton';
import useDueDateAlerts from '../../hooks/useDueDateAlerts';
import { isBefore, startOfDay, isPast, isToday } from 'date-fns';
import {
    ClipboardList,
    CheckCircle2,
    Clock,
    Percent,
    AlertCircle,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import UpcomingDeadlines from './components/UpcomingDeadlines';
import PersonalTrendChart from './components/PersonalTrendChart';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userId = user?.id;

    const fetchMyTasks = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getAssignedTasks(userId);
            setTasks(data || []);
        } catch (err) {
            console.error("Error fetching employee tasks:", err);
            setError(err.message || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks]);

    // Due date alerts with 60s auto-refresh
    const dueCounts = useDueDateAlerts(tasks, userId, fetchMyTasks);

    // Derived Metrics
    const metrics = useMemo(() => {
        const totalAssigned = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const pendingTasks = tasks.filter(t => t.status !== 'completed');

        // Reliability Score: Completed On Time / Total Completed
        let reliability = 100; // default
        if (completedTasks.length > 0) {
            const onTime = completedTasks.filter(t => {
                if (!t.due_date) return true;
                const completedAt = new Date(t.completed_at || t.updated_at || t.created_at);
                const due = new Date(t.due_date);

                // Check overdue logic
                if (t.status !== 'completed' && isPast(due) && !isToday(due)) {
                    overdueCount++;
                }

                // Safety check for malformed dates
                if (isNaN(completedAt.getTime()) || isNaN(due.getTime())) return false;

                return isBefore(startOfDay(completedAt), startOfDay(due)) || startOfDay(completedAt).getTime() === startOfDay(due).getTime();
            }).length;
            reliability = Math.round((onTime / completedTasks.length) * 100);
        }

        // Calculate pending overdue (just looping pendingTasks here to be safe and isolated from completed onTime loop logic)
        let overdueCount = 0;
        pendingTasks.forEach(t => {
            if (t.due_date) {
                const due = startOfDay(new Date(t.due_date));
                if (isPast(due) && !isToday(due)) {
                    overdueCount++;
                }
            }
        });

        return {
            totalAssigned,
            completedCount: completedTasks.length,
            pendingCount: pendingTasks.length,
            reliability,
            overdueCount
        };
    }, [tasks]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load data</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchMyTasks}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900"
                >
                    <RefreshCw size={16} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-[1600px] w-full mx-auto animate-fade-in pb-12">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">My Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Overview of your personal performance and upcoming work.</p>
                </div>
            </div>

            {/* Urgent Alert Banner */}
            {!loading && (metrics.overdueCount > 0 || dueCounts.dueToday > 0) && (
                <div className={`mb-6 px-4 py-3.5 rounded-xl border flex items-center gap-3 animate-fade-in ${
                    metrics.overdueCount > 0
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        metrics.overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                    }`}>
                        <AlertCircle size={16} />
                    </div>
                    <p className={`text-sm font-medium ${
                        metrics.overdueCount > 0 ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                    }`}>
                        {metrics.overdueCount > 0 && <><strong>{metrics.overdueCount} overdue task{metrics.overdueCount > 1 ? 's' : ''}</strong> require immediate attention. </>}
                        {dueCounts.dueToday > 0 && <><strong>{dueCounts.dueToday} task{dueCounts.dueToday > 1 ? 's' : ''}</strong> due today.</> }
                    </p>
                </div>
            )}

            {/* Row 1: Core metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                {loading ? (
                    <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
                ) : (
                    <>
                        <StatCard
                            title="My Assigned Tasks"
                            value={metrics.totalAssigned}
                            icon={ClipboardList}
                            trend="Total tasks ever assigned"
                            iconBg="bg-blue-50 dark:bg-blue-900/30"
                            iconColor="text-blue-600 dark:text-blue-400"
                        />
                        <StatCard
                            title="Completed Tasks"
                            value={metrics.completedCount}
                            icon={CheckCircle2}
                            trend="Tasks thoroughly finished"
                            progress={metrics.totalAssigned > 0 ? (metrics.completedCount / metrics.totalAssigned) * 100 : 0}
                            progressText={`${metrics.completedCount} of ${metrics.totalAssigned} tasks`}
                            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            title="My Reliability Score"
                            value={`${metrics.reliability}%`}
                            icon={Percent}
                            trend="On-time completion rate"
                            iconBg="bg-indigo-50 dark:bg-indigo-900/30"
                            iconColor="text-indigo-600 dark:text-indigo-400"
                        />
                    </>
                )}
            </div>

            {/* Row 2: Urgency metrics */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {loading ? (
                    <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
                ) : (
                    <>
                        <StatCard
                            title="Overdue"
                            value={dueCounts.overdue}
                            icon={AlertCircle}
                            trend="Past due date"
                            iconBg="bg-red-50 dark:bg-red-900/30"
                            iconColor="text-red-600 dark:text-red-400"
                        />
                        <StatCard
                            title="Due Today"
                            value={dueCounts.dueToday}
                            icon={AlertTriangle}
                            trend="Tasks due today"
                            iconBg="bg-amber-50 dark:bg-amber-900/30"
                            iconColor="text-amber-600 dark:text-amber-400"
                        />
                        <StatCard
                            title="Pending Tasks"
                            value={metrics.pendingCount}
                            icon={Clock}
                            trend="Tasks waiting on you"
                            iconBg="bg-slate-100 dark:bg-slate-800"
                            iconColor="text-slate-600 dark:text-slate-300"
                        />
                    </>
                )}
            </div>

            {/* Bottom Section: Trend Chart & Upcoming Deadlines */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Activity Trend (Last 7 Days)" className="h-full min-h-[400px]">
                        <PersonalTrendChart tasks={tasks} loading={loading} />
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card title="Upcoming Deadlines" className="h-full min-h-[400px]">
                        <UpcomingDeadlines tasks={tasks} loading={loading} />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
