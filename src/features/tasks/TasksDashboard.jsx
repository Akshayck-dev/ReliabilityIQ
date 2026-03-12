import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchTasks, assignTask, updateTaskStatus } from './tasksSlice';
import { AlertCircle, RefreshCw, ClipboardList, Archive, RotateCcw, Loader2, List, LayoutGrid, Plus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { taskService } from '../../services/taskService';
import EmptyState from '../../components/ui/EmptyState';
import { ListTaskRowSkeleton } from '../../components/ui/Skeleton';
import KanbanBoard from './KanbanBoard';
import { sortTasksByPriority } from '../../utils/sortTasks';
import toast from 'react-hot-toast';
import TaskDetailsDrawer from './TaskDetailsDrawer';

// New Redesign Components
import TaskStats from './TaskStats';
import TaskFilters from './TaskFilters';
import TaskListCard from './TaskListCard';

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

    // Filtering State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [assigneeFilter, setAssigneeFilter] = useState('all');

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

    // Advanced Filtering Logic
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            // Search Match
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || 
                task.title?.toLowerCase().includes(searchLower) || 
                task.description?.toLowerCase().includes(searchLower) ||
                task.id?.toLowerCase().includes(searchLower);

            // Status Match
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

            // Priority Match
            const matchesPriority = priorityFilter === 'all' || task.priority?.toLowerCase() === priorityFilter.toLowerCase();

            // Assignee Match
            const matchesAssignee = assigneeFilter === 'all' || task.assigned_to === assigneeFilter;

            return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
        });
    }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">
                        {role === 'manager' ? 'Company Tasks 🏢' : 'My Workspace 📝'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-lg">
                        {role === 'manager' 
                            ? 'Monitor team progress, reassign blocking tasks, and audit completed work.' 
                            : 'Manage your active assignments and update your status in real-time.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Toggle */}
                    {activeTab === 'active' && (
                        <div className="flex items-center bg-slate-100/80 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <List size={14} />
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'kanban'
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <LayoutGrid size={14} />
                                Board
                            </button>
                        </div>
                    )}
                    
                    {role === 'manager' && (
                        <Link to="/assign-task" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/25 active:scale-95">
                            <Plus size={18} />
                            Create Task
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Dashboard */}
            <TaskStats tasks={tasks} />

            {/* Controls & Navigation */}
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                    {/* Primary Tabs */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'active'
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Active Tasks
                            {activeTab === 'active' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
                        </button>
                        {role === 'manager' && (
                            <button
                                onClick={() => setActiveTab('archived')}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'archived'
                                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Archive Box
                                {activeTab === 'archived' && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-600 dark:bg-amber-400 rounded-full" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Advanced Filters */}
                {activeTab === 'active' && (
                    <TaskFilters 
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        priorityFilter={priorityFilter}
                        setPriorityFilter={setPriorityFilter}
                        assigneeFilter={assigneeFilter}
                        setAssigneeFilter={setAssigneeFilter}
                        employees={employees}
                    />
                )}
            </div>

            {/* ACTIVE TASKS — MAIN VIEWS */}
            {activeTab === 'active' && (
                <>
                    {viewMode === 'kanban' ? (
                        <KanbanBoard
                            tasks={filteredTasks}
                            dataStatus={status}
                            onStatusChange={handleStatusChange}
                            role={role}
                            onTaskClick={(id) => setSelectedTaskId(id)}
                        />
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px]">
                            <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                {status === 'loading' && tasks.length === 0 ? (
                                    [...Array(5)].map((_, i) => <ListTaskRowSkeleton key={i} />)
                                ) : filteredTasks.length === 0 ? (
                                    <div className="p-16">
                                        <EmptyState
                                            icon={ClipboardList}
                                            title={searchQuery ? "No matching tasks" : "No active tasks found"}
                                            description={searchQuery ? "Try adjusting your filters or search terms." : "Ready to scale? Create a new task to get started."}
                                            action={
                                                !searchQuery && role === 'manager' && (
                                                    <Link to="/assign-task" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 mt-4 rounded-xl text-sm font-bold transition-colors">
                                                        <Plus size={18} />
                                                        Assign First Task
                                                    </Link>
                                                )
                                            }
                                        />
                                    </div>
                                ) : (
                                    sortTasksByPriority(filteredTasks).map(task => (
                                        <TaskListCard 
                                            key={task.id} 
                                            task={task} 
                                            isManager={role === 'manager'}
                                            onClick={(id) => setSelectedTaskId(id)} 
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ARCHIVED TASKS VIEW */}
            {activeTab === 'archived' && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {archivedLoading ? (
                            <div className="p-20 flex flex-col items-center justify-center">
                                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Repository...</p>
                            </div>
                        ) : archivedTasks.length === 0 ? (
                            <div className="p-16">
                                <EmptyState
                                    icon={Archive}
                                    title="Archive is Empty"
                                    description="Tasks move here once they are deleted or permanently shelved."
                                />
                            </div>
                        ) : (
                            archivedTasks.map(task => (
                                <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="flex-1 space-y-2">
                                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                                            <button onClick={() => setSelectedTaskId(task.id)} className="hover:text-blue-600 transition-colors focus:outline-none">{task.title}</button>
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200/50 dark:border-slate-700/50">
                                                {task.status.replace('_', ' ')}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-900/30">
                                                Archived
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(task.id)}
                                        disabled={restoringId === task.id}
                                        className="flex items-center gap-2 text-sm px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all font-bold disabled:opacity-50"
                                    >
                                        {restoringId === task.id ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                                        Restore Task
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
                    dispatch(fetchTasks({ role, userId: user?.id }));
                }}
            />
        </div>
    );
};

export default TasksDashboard;
