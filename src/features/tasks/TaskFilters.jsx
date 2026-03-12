import React from 'react';
import { Search, Filter, ChevronDown, SlidersHorizontal, Users, ShieldAlert } from 'lucide-react';

const TaskFilters = ({ 
    searchQuery, 
    setSearchQuery, 
    statusFilter, 
    setStatusFilter, 
    priorityFilter, 
    setPriorityFilter,
    assigneeFilter,
    setAssigneeFilter,
    employees = []
}) => {
    const statuses = [
        { id: 'all', label: 'All Tasks' },
        { id: 'pending', label: 'To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'review', label: 'Review' },
        { id: 'completed', label: 'Completed' }
    ];

    return (
        <div className="space-y-4">
            {/* Main Search & Status Tabs */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Status Tabs */}
                <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto no-scrollbar whitespace-nowrap">
                    {statuses.map(status => (
                        <button
                            key={status.id}
                            onClick={() => setStatusFilter(status.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === status.id
                                    ? 'bg-white dark:bg-slate-700 text-[#0f172a] dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title, description, or id..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[14px] font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Sub-Filters (Priority / Assignee) */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500">
                   <SlidersHorizontal size={14} className="text-slate-400" />
                   <span className="text-[11px] font-bold uppercase tracking-wider">Refine By</span>
                </div>

                {/* Priority Dropdown */}
                <div className="relative group/select">
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="appearance-none pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer min-w-[140px]"
                    >
                        <option value="all">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                    </select>
                    <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/select:rotate-180 transition-transform" size={16} />
                </div>

                {/* Assignee Dropdown */}
                <div className="relative group/select">
                    <select
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="appearance-none pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer min-w-[160px]"
                    >
                        <option value="all">All Assignees</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.full_name || emp.email.split('@')[0]}</option>
                        ))}
                    </select>
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/select:rotate-180 transition-transform" size={16} />
                </div>

                {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
                    <button 
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setPriorityFilter('all');
                            setAssigneeFilter('all');
                        }}
                        className="text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline px-2"
                    >
                        Reset All
                    </button>
                )}
            </div>
        </div>
    );
};

export default TaskFilters;
