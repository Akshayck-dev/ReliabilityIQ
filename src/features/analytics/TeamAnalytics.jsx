import React, { useEffect, useState, useMemo } from 'react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../auth/AuthContext';
import { Navigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import { FullPageSpinner } from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';
import { AlertCircle, RefreshCw, Users, ShieldCheck, Clock } from 'lucide-react';

const TeamAnalytics = () => {
    const { role, user } = useAuth();
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Removed early return before hooks

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getEmployeeReliabilityStats(user?.id);
            setStats(data || []);
        } catch (err) {
            console.error("Error fetching team analytics:", err);
            setError(err.message || "Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Derived full-team metrics
    const aggregatedMetrics = useMemo(() => {
        if (!stats.length) return { totalEmployees: 0, avgReliability: '0', totalTasks: 0, pendingTasks: 0 };

        const totalTasks = stats.reduce((acc, curr) => acc + curr.totalAssigned, 0);
        const totalCompletedOnTime = stats.reduce((acc, curr) => acc + curr.onTime, 0);
        const totalPending = stats.reduce((acc, curr) => acc + curr.pending, 0);

        const avgReliability = totalTasks > 0
            ? Math.round((totalCompletedOnTime / totalTasks) * 100)
            : 0;

        return {
            totalEmployees: stats.length,
            avgReliability: avgReliability.toString(),
            totalTasks,
            pendingTasks: totalPending
        };
    }, [stats]);

    // If not manager, boot them
    if (role !== 'manager') {
        return <Navigate to="/unauthorized" replace />;
    }

    if (loading) return <FullPageSpinner message="Compiling analytics..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white border border-red-100 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to load analytics</h3>
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

    return (
        <div className="flex flex-col h-full min-h-screen pb-12 animate-fade-in">
            {/* Header Content */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">Team Performance Analytics</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Detailed statistical breakdown of your organization's reliability.</p>
                </div>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Analyzed Members"
                    value={aggregatedMetrics.totalEmployees.toString()}
                    trend="Currently tracked employees"
                    icon={Users}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatCard
                    title="Average Reliability"
                    value={aggregatedMetrics.avgReliability.toString()}
                    valueSuffix="%"
                    trend="Completed on-time vs assigned"
                    icon={ShieldCheck}
                    iconBg={Number(aggregatedMetrics.avgReliability) >= 80 ? 'bg-emerald-50' : 'bg-amber-50'}
                    iconColor={Number(aggregatedMetrics.avgReliability) >= 80 ? 'text-emerald-600' : 'text-amber-600'}
                />
                <StatCard
                    title="Pending Tasks"
                    value={aggregatedMetrics.pendingTasks.toString()}
                    trend="Across all employees"
                    icon={Clock}
                    iconBg="bg-indigo-50"
                    iconColor="text-indigo-600"
                />
            </div>

            {/* Detailed Table */}
            <Card noPadding className="overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Employee Reliability Roster</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Individual breakdowns comparing on-time completions against total assignments.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                        <thead className="bg-[#f8fafc] dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">Employee</th>
                                <th scope="col" className="px-6 py-4">Status Breakdown</th>
                                <th scope="col" className="px-6 py-4 w-64 text-right">Reliability Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {stats.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                                <AlertCircle className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <h3 className="text-base font-bold text-slate-800">No Analytics Data</h3>
                                            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Employees will appear here once tasks are assigned to them.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                stats.map((stat) => (
                                    <tr key={stat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-slate-100">{stat.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{stat.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 text-xs font-medium">
                                                <div className="flex items-center gap-1.5 min-w-[80px]">
                                                    <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-600"></div>
                                                    <span className="text-slate-600 dark:text-slate-300">{stat.totalAssigned} Assigned</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-[80px]">
                                                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                                    <span className="text-slate-600 dark:text-slate-300">{stat.pending} Pending</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-[80px]">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    <span className="text-emerald-700">{stat.onTime} On-Time</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                <span className={`text-sm font-bold w-12 text-right ${stat.reliability >= 80 ? 'text-emerald-600' :
                                                    stat.reliability >= 50 ? 'text-amber-500' : 'text-red-500'
                                                    }`}>
                                                    {stat.reliability}%
                                                </span>
                                                <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700 shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${stat.reliability >= 80 ? 'bg-emerald-500' :
                                                            stat.reliability >= 50 ? 'bg-amber-400' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${stat.reliability}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TeamAnalytics;
