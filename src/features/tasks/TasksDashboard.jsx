import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTasks, assignTask, updateTaskStatus } from './tasksSlice';
import { AlertCircle, RefreshCw, ClipboardList, Archive, RotateCcw, Loader2, List, LayoutGrid, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { taskService } from '../../services/taskService';
import EmptyState from '../../components/ui/EmptyState';
import PriorityBadge from '../../components/ui/PriorityBadge';
import { ListTaskRowSkeleton } from '../../components/ui/Skeleton';
import KanbanBoard from './KanbanBoard';
import { sortTasksByPriority } from '../../utils/sortTasks';
import { getDueStatus } from '../../utils/dueDateUtils';
import toast from 'react-hot-toast';
import TaskDetailsDrawer from './TaskDetailsDrawer';

const TasksDashboard = () => {
    const dispatch = useDispatch();
    const { role, user } = useAuth();
    const { items: tasks, status, error } = useSelector((state) => state.tasks);

    const [employees, setEmployees] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [viewMode, setViewMode] = useState('list');
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [archivedLoading, setArchivedLoading] = useState(false);
    const [restoringId, setRestoringId] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    useEffect(() => {
        dispatch(fetchTasks({ role, userId: user?.id }));

        if (role === 'manager') {
            taskService.getAvailableEmployees()
                .then(setEmployees)
                .catch(console.error);
        }
    }, [dispatch, role, user]);

    // Fetch archived tasks when tab switches
    useEffect(() => {
        if (activeTab === 'archived' && role === 'manager' && user?.id) {
            setArchivedLoading(true);
            taskService.getArchivedTasks(user.id)
                .then(setArchivedTasks)
                .catch(console.error)
                .finally(() => setArchivedLoading(false));
        }
    }, [activeTab, role, user?.id]);

    const handleStatusChange = (taskId, currentStatus, newStatus) => {
        dispatch(updateTaskStatus({ taskId, currentStatus, newStatus, userEmail: user.email }));
    };

    const handleAssignTask = (taskId, employeeId) => {
        dispatch(assignTask({ taskId, employeeId, userEmail: user.email }));
    };

    const handleRestore = async (taskId) => {
        setRestoringId(taskId);
        try {
            await taskService.restoreTask(taskId);
            setArchivedTasks(prev => prev.filter(t => t.id !== taskId));
            dispatch(fetchTasks({ role, userId: user?.id }));
            toast.success('Task restored successfully');
        } catch (err) {
            toast.error('Failed to restore task');
        } finally {
            setRestoringId(null);
        }
    };

    // Removed FullPageSpinner early return for proper Skeleton rendering
    if (status === 'failed') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 rounded-xl max-w-lg mx-auto mt-12 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Failed to load tasks</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-sm">{error}</p>
                <button
                    onClick={() => dispatch(fetchTasks({ role, userId: user?.id }))}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus:ring-4 focus:ring-slate-100"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                    {role === 'manager' ? 'Company Tasks 🏢' : 'My Tasks 📝'}
                </h1>

                {/* View Toggle */}
                {activeTab === 'active' && (
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
                )}
            </div>

            {/* Tab Toggle (Managers Only) */}
            {role === 'manager' && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === 'active'
                            ? 'bg-slate-900 dark:bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <ClipboardList size={15} />
                            Active Tasks
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === 'archived'
                            ? 'bg-slate-900 dark:bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        <span className="flex items-center gap-1.5">
                            <Archive size={15} />
                            Archived
                            {archivedTasks.length > 0 && activeTab !== 'archived' && (
                                <span className="ml-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {archivedTasks.length}
                                </span>
                            )}
                        </span>
                    </button>
                </div>
            )}

            {/* ACTIVE TASKS — KANBAN VIEW */}
            {activeTab === 'active' && viewMode === 'kanban' && (
                <KanbanBoard
                    tasks={tasks}
                    dataStatus={status}
                    onStatusChange={handleStatusChange}
                    role={role}
                    onTaskClick={(id) => setSelectedTaskId(id)}
                />
            )}

            {/* ACTIVE TASKS — LIST VIEW */}
            {activeTab === 'active' && viewMode === 'list' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Active Tasks ({tasks.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                        {status === 'loading' && tasks.length === 0 ? (
                            [...Array(5)].map((_, i) => <ListTaskRowSkeleton key={i} />)
                        ) : tasks.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    icon={ClipboardList}
                                    title="Looks quite empty here"
                                    description="Let's get things moving. Assign a new task to your team."
                                    action={
                                        role === 'manager' && (
                                            <Link to="/tasks/assign" className="inline-flex items-center gap-2 bg-[#ea580c] hover:bg-orange-600 text-white px-4 py-2 mt-2 rounded-lg text-sm font-bold transition-colors">
                                                <Plus size={16} />
                                                Assign New Task
                                            </Link>
                                        )
                                    }
                                />
                            </div>
                        ) : (
                            sortTasksByPriority(tasks).map(task => (
                                <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                                <button onClick={() => setSelectedTaskId(task.id)} className="hover:text-[#ea580c] transition-colors relative z-10 block w-fit focus:outline-none">{task.title}</button>
                                            </h3>
                                            {task.parent_status && task.parent_status !== 'completed' && (
                                                <div title="Blocked by dependency" className="flex items-center justify-center p-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400">
                                                    <AlertCircle size={16} />
                                                </div>
                                            )}
                                        </div>
                                        {task.description && <p className="text-slate-600 dark:text-slate-400 mt-1">{task.description}</p>}

                                        <div className="flex flex-wrap items-center mt-3 gap-3 text-xs font-medium">
                                            <span className={`px-2.5 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {task.status.replace('_', ' ').toUpperCase()}
                                            </span>

                                            <PriorityBadge priority={task.priority || 'medium'} />

                                            {task.due_date && (() => {
                                                const dueStatus = getDueStatus(task);
                                                const dueStyles = {
                                                    'overdue': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold px-2 py-0.5 rounded-full text-[11px]',
                                                    'due_today': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full text-[11px]',
                                                    'due_soon': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full text-[11px]'
                                                };
                                                return (
                                                    <span className={`flex items-center ${dueStatus ? dueStyles[dueStatus] : 'text-slate-500 dark:text-slate-400'}`}>
                                                        <svg className={`w-4 h-4 mr-1 ${dueStatus ? '' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {dueStatus === 'overdue' ? 'Overdue' : dueStatus === 'due_today' ? 'Due Today' : dueStatus === 'due_soon' ? 'Due Soon' : `Due: ${new Date(task.due_date).toLocaleDateString()}`}
                                                    </span>
                                                )
                                            })()}

                                            {role === 'manager' && (
                                                <span className="text-slate-500 flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    {task.assignee?.email || 'Unassigned'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex items-center gap-2">

                                        {/* Employee Actions: Status Updates */}
                                        {role === 'employee' && task.status !== 'completed' && (
                                            <>
                                                {task.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(task.id, task.status, 'in_progress')}
                                                        className="text-sm px-3 py-1.5 border border-amber-500 text-amber-600 rounded-md hover:bg-amber-50"
                                                    >
                                                        Start Work
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleStatusChange(task.id, task.status, 'completed')}
                                                    className="text-sm px-3 py-1.5 border border-green-500 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition"
                                                >
                                                    Mark Complete
                                                </button>
                                            </>
                                        )}

                                        {/* Manager Actions: Reassign */}
                                        {role === 'manager' && (
                                            <select
                                                className="text-sm border border-slate-300 dark:border-slate-700 rounded-md p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 w-32 focus:ring-blue-500"
                                                value={task.assigned_to || ''}
                                                onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                            >
                                                <option value="" disabled>Reassign...</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.email.split('@')[0]}</option>
                                                ))}
                                            </select>
                                        )}

                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ARCHIVED TASKS VIEW (Managers Only) */}
            {activeTab === 'archived' && role === 'manager' && (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Archived Tasks ({archivedTasks.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                        {archivedLoading ? (
                            <div className="p-12 flex flex-col items-center justify-center">
                                <Loader2 size={28} className="animate-spin text-slate-400 mb-3" />
                                <p className="text-sm font-medium text-slate-500">Loading archived tasks...</p>
                            </div>
                        ) : archivedTasks.length === 0 ? (
                            <div className="p-8">
                                <EmptyState
                                    icon={Archive}
                                    title="Empty Archive"
                                    description="Archived tasks will appear here when they are no longer active."
                                />
                            </div>
                        ) : (
                            archivedTasks.map(task => (
                                <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                                            <button onClick={() => setSelectedTaskId(task.id)} className="hover:text-[#ea580c] transition-colors relative z-10 block w-fit focus:outline-none">{task.title}</button>
                                        </h3>
                                        {task.description && <p className="text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>}
                                        <div className="flex flex-wrap items-center mt-3 gap-3 text-xs font-medium">
                                            <span className={`px-2.5 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                task.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {task.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-bold">
                                                <Archive size={12} className="inline mr-1 -mt-0.5" />
                                                Archived
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(task.id)}
                                        disabled={restoringId === task.id}
                                        className="flex items-center gap-1.5 text-sm px-4 py-2 border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {restoringId === task.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                        Restore
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Slide-out Task Details Drawer */}
            <TaskDetailsDrawer
                taskId={selectedTaskId}
                onClose={() => {
                    setSelectedTaskId(null);
                    // Refresh data if needed when closing the drawer
                    dispatch(fetchTasks({ role, userId: user?.id }));
                }}
            />
        </div>
    );
};

export default TasksDashboard;
