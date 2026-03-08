import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { ClipboardList, CheckCircle2, ClipboardSignature, Loader2, AlertCircle, RefreshCw, List, LayoutGrid } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../features/auth/AuthContext';
import { format, differenceInDays } from 'date-fns';
import { FullPageSpinner } from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import KanbanBoard from '../../features/tasks/KanbanBoard';
import { sortTasksByPriority } from '../../utils/sortTasks';

const MyTasks = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState('All');
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [viewMode, setViewMode] = useState('list');

    const userId = user?.id;

    const fetchMyTasks = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await taskService.getAssignedTasks(userId);
            setTasks(data || []);
        } catch (err) {
            console.error("Failed to load tasks", err);
            setError(err.message || "Failed to load your tasks.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks]);

    if (loading) return <FullPageSpinner message="Loading your tasks..." />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load data</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={fetchMyTasks}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-4 focus:ring-slate-100"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    // Format the database tasks into the shape the UI expects
    const formattedTasks = tasks.map(task => {
        const assignedDateStr = format(new Date(task.created_at), 'MMM dd, yyyy');
        const deadlineStr = task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : 'No deadline';

        let delayStr = '-';
        let delayColor = 'default';
        let isOverdue = false;

        if (task.due_date) {
            const due = new Date(task.due_date);
            const now = new Date();
            if (task.status !== 'completed' && due < now) {
                isOverdue = true;
                const daysOver = differenceInDays(now, due);
                delayStr = `${daysOver} day${daysOver !== 1 ? 's' : ''}`;
                delayColor = daysOver > 2 ? 'red' : 'yellow';
            }
        }

        const uiStatusMap = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed'
        };

        const uiStatus = uiStatusMap[task.status] || 'Pending';

        let actionLabel = 'Start Task';
        if (uiStatus === 'In Progress') actionLabel = 'Mark Complete';
        if (uiStatus === 'Completed') actionLabel = 'Completed';

        return {
            id: task.id,
            name: task.title,
            assigned: assignedDateStr,
            deadline: deadlineStr,
            priority: (task.priority || 'medium').toUpperCase(),
            status: uiStatus,
            delay: delayStr,
            action: actionLabel,
            deadlineOverdue: isOverdue,
            delayColor: delayColor
        };
    });

    // Sort by priority (High → Med → Low) and then by due_date
    const sortedFormattedTasks = sortTasksByPriority(
        formattedTasks.map(ft => {
            // Ensure sort uses lowercase for matching
            const original = tasks.find(t => t.id === ft.id);
            return { ...ft, priority_raw: (original?.priority || 'medium').toLowerCase(), due_date: original?.due_date };
        })
    ).map(({ priority_raw, due_date, ...rest }) => rest);

    const filteredTasks = sortedFormattedTasks.filter(task => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return task.status === 'Pending' || task.status === 'In Progress';
        if (filter === 'Completed') return task.status === 'Completed';
        return true;
    });

    const renderPriorityBadge = (priority) => {
        const colors = {
            'HIGH': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            'MEDIUM': 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
            'LOW': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${colors[priority] || colors['MEDIUM']}`}>
                {priority}
            </span>
        );
    };

    const renderStatusBadge = (status) => {
        const config = {
            'In Progress': { bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', dot: 'bg-blue-600 dark:bg-blue-400' },
            'Completed': { bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', dot: 'bg-green-500 dark:bg-green-400' },
            'Pending': { bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300', dot: 'bg-slate-400 dark:bg-slate-500' }
        };
        const st = config[status];
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${st.bg}`}>
                <span className={`w-1 h-1 rounded-full mr-1.5 ${st.dot}`}></span>
                {status}
            </span>
        );
    };

    const handleStatusChange = async (taskId, currentStatus, newStatus) => {
        if (actionLoadingId) return;
        setActionLoadingId(taskId);
        try {
            if (newStatus === 'completed') {
                await taskService.markTaskComplete(taskId, user.email);
            } else {
                await taskService.updateTaskStatus(taskId, newStatus, user.email);
            }
            toast.success("Task status updated!");
            fetchMyTasks();
        } catch (err) {
            toast.error(err.message || "Failed to update task.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const renderActionButton = (action, taskId) => {
        const isThisLoading = actionLoadingId === taskId;
        if (action === 'Mark Complete') {
            return (
                <button
                    onClick={() => handleStatusChange(taskId, 'in_progress', 'completed')}
                    disabled={isThisLoading || !!actionLoadingId}
                    className="bg-[#ea580c] hover:bg-orange-700 text-white text-[11px] font-bold px-4 py-2 rounded-md transition-colors w-28 text-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                    {isThisLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isThisLoading ? 'Saving...' : action}
                </button>
            );
        }
        if (action === 'Start Task') {
            return (
                <button
                    onClick={() => handleStatusChange(taskId, 'pending', 'in_progress')}
                    disabled={isThisLoading || !!actionLoadingId}
                    className="bg-white dark:bg-slate-900 border border-[#ea580c] text-[#ea580c] hover:bg-orange-50 dark:hover:bg-orange-950/30 text-[11px] font-bold px-4 py-2 rounded-md transition-colors w-28 text-center disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                    {isThisLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {isThisLoading ? 'Saving...' : action}
                </button>
            );
        }
        if (action === 'Completed') {
            return (
                <button disabled className="bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold px-4 py-2 rounded-md cursor-not-allowed w-28 text-center">
                    {action}
                </button>
            );
        }
        return null;
    };

    // Reliability Calculation
    const totalAssigned = formattedTasks.length;
    const completedOnTime = formattedTasks.filter(t => t.status === 'Completed' && !t.deadlineOverdue).length;

    const reliabilityScore = totalAssigned > 0
        ? Math.round((completedOnTime / totalAssigned) * 100)
        : 100; // default to 100% if no tasks

    return (
        <div className="flex flex-col h-full max-w-[1200px]">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">My Tasks</h1>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">Manage and complete your assigned tasks</p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-0.5">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'list'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <List size={14} />
                        List
                    </button>
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${viewMode === 'kanban'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <LayoutGrid size={14} />
                        Board
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card noPadding className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">My Reliability Score</h3>
                            <div className="flex items-baseline gap-2 mt-2">
                                <p className="text-[32px] font-bold text-[#0f172a] dark:text-white">{loading ? '-' : reliabilityScore}</p>
                                {!loading && <span className="text-lg font-bold text-slate-400 dark:text-slate-500 -ml-1">%</span>}
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                            <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </Card>
                <Card noPadding className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Assigned</h3>
                            <p className="text-[32px] font-bold text-[#0f172a] dark:text-white mt-2">{loading ? '-' : totalAssigned}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                            <ClipboardList size={16} className="text-slate-600 dark:text-slate-400" />
                        </div>
                    </div>
                </Card>
                <Card noPadding className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Tasks</h3>
                            <p className="text-[32px] font-bold text-[#0f172a] dark:text-white mt-2">{loading ? '-' : formattedTasks.filter(t => t.status !== 'Completed').length}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#ffedd5] dark:bg-orange-900/30 flex items-center justify-center border border-orange-100 dark:border-orange-800">
                            <ClipboardSignature size={16} className="text-[#ea580c] dark:text-orange-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* KANBAN VIEW */}
            {viewMode === 'kanban' && (
                <div className="mb-16">
                    <KanbanBoard
                        tasks={tasks}
                        onStatusChange={handleStatusChange}
                        role="employee"
                    />
                </div>
            )}

            {/* LIST VIEW — Task Table Area */}
            {viewMode === 'list' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-slate-800 overflow-hidden mb-16">

                    {/* Optional Filter Area */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        {['All', 'Pending', 'Completed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${filter === f
                                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold">TASK NAME</th>
                                    <th className="px-6 py-4 font-bold">ASSIGNED</th>
                                    <th className="px-6 py-4 font-bold">DEADLINE</th>
                                    <th className="px-6 py-4 font-bold">PRIORITY</th>
                                    <th className="px-6 py-4 font-bold">STATUS</th>
                                    <th className="px-6 py-4 font-bold">DELAY</th>
                                    <th className="px-6 py-4 font-bold">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Loader2 size={32} className="text-[#ea580c] animate-spin mb-3" />
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">Loading tasks...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8">
                                            <EmptyState
                                                icon={ClipboardList}
                                                title="No tasks found"
                                                description="You're all caught up!"
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-5 font-semibold text-[13px] text-slate-900 dark:text-slate-100">
                                                <Link to={`/tasks/${task.id}`} className="hover:text-[#ea580c] transition-colors">{task.name}</Link>
                                            </td>
                                            <td className="px-6 py-5 text-[13px] text-slate-500 dark:text-slate-400">
                                                <span className="block">{task.assigned.split(',')[0]},</span>
                                                <span className="block">{task.assigned.split(',')[1] || ''}</span>
                                            </td>
                                            <td className="px-6 py-5 text-[13px] text-slate-900 dark:text-slate-100 font-medium">
                                                <span className={`block ${task.deadlineOverdue ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full text-center text-[11px] font-bold -ml-2 table' : ''}`}>
                                                    {task.deadline.split(',')[0]},<br />
                                                    {task.deadline.split(',')[1] || ''}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {renderPriorityBadge(task.priority)}
                                            </td>
                                            <td className="px-6 py-5">
                                                {renderStatusBadge(task.status)}
                                            </td>
                                            <td className="px-6 py-5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
                                                {task.delayColor === 'default' && task.delay}
                                                {task.delayColor === 'yellow' && (
                                                    <span className="bg-[#fef3c7] dark:bg-yellow-900/30 text-[#b45309] dark:text-yellow-500 px-2.5 py-1 rounded-full">{task.delay}</span>
                                                )}
                                                {task.delayColor === 'red' && (
                                                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full">{task.delay}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                {renderActionButton(task.action, task.id)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyTasks;
