import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, ClipboardList, Loader2, X } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { taskService } from '../../services/taskService';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
    pending: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    in_progress: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    completed: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
};

const STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed'
};

const GlobalSearch = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Debounced search
    useEffect(() => {
        if (query.length <= 1) {
            setEmployees([]);
            setTasks([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setIsOpen(true);

        const timer = setTimeout(async () => {
            try {
                const promises = [];

                // Managers search employees + tasks; employees only tasks
                if (role === 'manager') {
                    promises.push(taskService.searchEmployees(user.id, query));
                } else {
                    promises.push(Promise.resolve([]));
                }
                promises.push(taskService.searchTasks(user.id, role, query));

                const [empResults, taskResults] = await Promise.all(promises);
                setEmployees(empResults);
                setTasks(taskResults);
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, user?.id, role]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = () => {
        setQuery('');
        setIsOpen(false);
        setEmployees([]);
        setTasks([]);
        inputRef.current?.focus();
    };

    const handleEmployeeClick = () => {
        setIsOpen(false);
        setQuery('');
        navigate('/employees');
    };

    const handleTaskClick = (task) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/tasks/${task.id}`);
    };

    const hasResults = employees.length > 0 || tasks.length > 0;

    return (
        <div ref={containerRef} className="relative w-full max-w-[500px]">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    {loading ? (
                        <Loader2 className="h-[18px] w-[18px] text-[#ea580c] animate-spin" />
                    ) : (
                        <Search className="h-[18px] w-[18px] text-slate-400" />
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                    placeholder={role === 'manager' ? 'Search employees, tasks...' : 'Search tasks...'}
                    className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all shadow-sm"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                    {loading ? (
                        <div className="flex items-center justify-center p-6">
                            <Loader2 size={20} className="animate-spin text-[#ea580c]" />
                            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Searching...</span>
                        </div>
                    ) : !hasResults ? (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                            <Search size={22} className="text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-sm font-bold text-slate-900 dark:text-white">No results found</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Try a different search term.
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[360px] overflow-y-auto">
                            {/* Employees Section */}
                            {employees.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <Users size={14} className="text-slate-400" />
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employees</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({employees.length})</span>
                                    </div>
                                    {employees.map((emp) => (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleEmployeeClick(emp)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/50"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                                                {(emp.name || emp.email || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                    {emp.name || emp.email?.split('@')[0]}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{emp.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Tasks Section */}
                            {tasks.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <ClipboardList size={14} className="text-slate-400" />
                                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tasks</span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({tasks.length})</span>
                                    </div>
                                    {tasks.map((task) => (
                                        <button
                                            key={task.id}
                                            onClick={() => handleTaskClick(task)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800/50"
                                        >
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate flex-1 min-w-0">
                                                {task.title}
                                            </p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${STATUS_STYLES[task.status] || STATUS_STYLES.pending}`}>
                                                {STATUS_LABELS[task.status] || task.status}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
