import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../../services/taskService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Mail, AlertTriangle, CheckCircle2, Clock, CheckSquare, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import { FullPageSpinner } from '../../components/ui/Spinner';

// Helper component for task status badges
const TaskStatusBadge = ({ status }) => {
    switch (status) {
        case 'completed':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 size={12} /> Completed</span>;
        case 'in_progress':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Clock size={12} /> In Progress</span>;
        case 'pending':
            return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"><CheckSquare size={12} /> Pending</span>;
        default:
            return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
};

const EmployeeProfile = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getEmployeePerformanceProfile(employeeId);
            setProfileData(data);
        } catch (err) {
            console.error("Failed to fetch employee profile:", err);
            setError(err.message || 'Failed to load employee data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (employeeId) fetchProfile();
    }, [employeeId]);

    if (loading) return <FullPageSpinner message="Loading employee profile..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4"><XCircle size={24} /></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Profile Not Found</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm">{error}</p>
                <div className="flex gap-3">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Go Back</button>
                    <button onClick={fetchProfile} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"><RefreshCw size={16} /> Retry</button>
                </div>
            </div>
        );
    }

    if (!profileData) return null;

    const { employee, stats, performanceTrends, recentTasks } = profileData;
    const needsAttention = stats.currentReliability < 70;

    return (
        <div className="flex flex-col h-full max-w-[1200px] w-full pb-12 animate-fade-in relative">

            {/* Needs Attention Warning */}
            {needsAttention && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3 w-full">
                    <AlertTriangle className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-sm font-bold text-red-800 dark:text-red-400">Needs Attention</h3>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                            {employee.name}'s current reliability score is below 70%. It is recommended to schedule a check-in to identify and resolve any operational blockers or workload issues.
                        </p>
                    </div>
                </div>
            )}

            {/* Back Navigation & Breadcrumb */}
            <button
                onClick={() => navigate('/employees')}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-6 w-fit rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <ArrowLeft size={16} /> Back to Team
            </button>

            {/* Employee Profile Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-[#1e40af] flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
                        {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{employee.name}</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider border border-green-200 dark:border-green-800/50">
                                {employee.status}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{employee.designation}</p>
                    </div>
                </div>

                <a
                    href={`mailto:${employee.email}`}
                    className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors mt-2 sm:mt-0 border border-slate-200 dark:border-slate-700"
                >
                    <Mail size={16} /> Contact
                </a>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Tasks Completed</p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.tasksCompletedLast6Mo}</span>
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-400 mt-3 font-medium">Last 6 Months</p>
                </Card>

                <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Average Delay</p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className={`text-3xl font-bold ${stats.avgDelay.includes('d') || parseInt(stats.avgDelay) > 24 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                                {stats.avgDelay}
                            </span>
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-400 mt-3 font-medium">Across all tasks</p>
                </Card>

                <Card className="p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">Current Reliability</p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className={`text-3xl font-bold ${needsAttention ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-white'}`}>
                                {stats.currentReliability}%
                            </span>
                            {needsAttention && <AlertCircle size={18} className="text-red-500 shrink-0" />}
                        </div>
                    </div>
                    <p className="text-[12px] text-slate-400 mt-3 font-medium">Completed on time count</p>
                </Card>
            </div>

            {/* Performance Trends Chart */}
            <Card className="p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 flex flex-col">
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-6">Performance Trends (6 Months)</h2>
                <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceTrends} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13 }}
                                domain={[0, 100]}
                                tickFormatter={(v) => `${v}%`}
                            />
                            <Tooltip
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value) => [`${value}%`, 'Reliability']}
                            />
                            <Line
                                type="monotone"
                                dataKey="reliability"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                                activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Recent Task Activity */}
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white mb-4">Recent Task Activity</h2>
            <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-600 dark:text-slate-400 tracking-wider">TASK ID</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-600 dark:text-slate-400 tracking-wider">TITLE</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-600 dark:text-slate-400 tracking-wider">STATUS</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-600 dark:text-slate-400 tracking-wider">DUE DATE</th>
                                <th className="px-6 py-4 text-[12px] font-bold text-slate-600 dark:text-slate-400 tracking-wider">DELAY</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {recentTasks.length > 0 ? recentTasks.map((task) => (
                                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-[13px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded">
                                            {task.shortId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[14px] font-semibold text-slate-900 dark:text-slate-200 max-w-[250px] truncate">
                                        {task.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <TaskStatusBadge status={task.status} />
                                    </td>
                                    <td className="px-6 py-4 text-[14px] font-medium text-slate-600 dark:text-slate-400">
                                        {task.dueDate}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[13px] font-bold ${task.delay !== '0h' && task.delay !== '-'
                                                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded w-fit'
                                                : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                            {task.delay}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-slate-500">
                                        No recent tasks found for this employee.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
