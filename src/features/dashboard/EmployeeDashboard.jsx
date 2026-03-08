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
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-red-100 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to load data</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchMyTasks}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full max-w-[1600px] w-full mx-auto animate-fade-in pb-12">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview of your personal performance and upcoming work.</p>
                </div>
            </div>

            {/* Slide-Down Banner for Overdue / Due Today Tasks */}
            {(metrics.overdueCount > 0 || dueCounts.dueToday > 0) && (
                <div className={`mb-8 p-4 ${metrics.overdueCount > 0 ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'} border rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 fade-in duration-500 shadow-sm`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${metrics.overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'} flex items-center justify-center shrink-0`}>
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold ${metrics.overdueCount > 0 ? 'text-red-900 dark:text-red-300' : 'text-amber-900 dark:text-amber-300'}`}>Action Required</h3>
                            <p className={`text-sm ${metrics.overdueCount > 0 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                {metrics.overdueCount > 0 && (
                                    <><strong className="font-bold">{metrics.overdueCount} overdue task{metrics.overdueCount > 1 ? 's' : ''}</strong> need immediate attention. </>
                                )}
                                {dueCounts.dueToday > 0 && (
                                    <><strong className="font-bold">{dueCounts.dueToday} task{dueCounts.dueToday > 1 ? 's' : ''}</strong> due today.</>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {loading ? (
                    <>
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
                            title="My Assigned Tasks"
                            value={metrics.totalAssigned}
                            icon={ClipboardList}
                            trend="Total tasks ever assigned"
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                        />
                        <StatCard
                            title="Completed Tasks"
                            value={metrics.completedCount}
                            icon={CheckCircle2}
                            trend="Tasks thoroughly finished"
                            progress={metrics.totalAssigned > 0 ? (metrics.completedCount / metrics.totalAssigned) * 100 : 0}
                            progressText={`Completed tasks: ${metrics.completedCount} / ${metrics.totalAssigned}`}
                            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                            iconColor="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            title="Pending Tasks"
                            value={metrics.pendingCount}
                            icon={Clock}
                            trend="Tasks waiting on you"
                            iconBg="bg-orange-50 dark:bg-orange-900/30"
                            iconColor="text-[#ea580c] dark:text-orange-400"
                        />
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
