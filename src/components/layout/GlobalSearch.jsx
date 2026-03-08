import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Users, ClipboardList, X, Command } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
    pending: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    in_progress: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    completed: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
};

const STATUS_LABELS = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed'
};

const PRIORITY_DOT = {
    low: 'bg-emerald-400',
    medium: 'bg-amber-400',
    high: 'bg-rose-400'
};

const GlobalSearch = () => {
    const { role } = useAuth();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Pull tasks from Redux store (no API calls)
    const allTasks = useSelector(state => state.tasks.items);

    // Client-side filtering with debounce-like useMemo
    const filteredResults = useMemo(() => {
        if (query.trim().length < 2) return { tasks: [], employees: [] };

        const q = query.toLowerCase().trim();

        // Search tasks by title and description
        const matchedTasks = allTasks.filter(task => {
            const titleMatch = task.title?.toLowerCase().includes(q);
            const descMatch = task.description?.toLowerCase().includes(q);
            return titleMatch || descMatch;
        }).slice(0, 8); // Limit results for performance

        // Extract unique employees from tasks (assigned_to email)
        const employeeMap = new Map();
        allTasks.forEach(task => {
            if (task.assigned_to && task.assignee_email) {
                const name = task.assignee_email.split('@')[0];
                if (name.toLowerCase().includes(q) || task.assignee_email.toLowerCase().includes(q)) {
                    if (!employeeMap.has(task.assigned_to)) {
                        employeeMap.set(task.assigned_to, {
                            id: task.assigned_to,
                            email: task.assignee_email,
                            name: name,
                            activeTasks: allTasks.filter(t => t.assigned_to === task.assigned_to && t.status !== 'completed').length
                        });
                    }
                }
            }
        });

        return {
            tasks: matchedTasks,
            employees: Array.from(employeeMap.values()).slice(0, 5)
        };
    }, [query, allTasks]);

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

    // Keyboard shortcut: Ctrl+K to focus
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Arrow key navigation
    const flatResults = useMemo(() => {
        const items = [];
        filteredResults.employees.forEach(emp => items.push({ type: 'employee', data: emp }));
        filteredResults.tasks.forEach(task => items.push({ type: 'task', data: task }));
        return items;
    }, [filteredResults]);

    const handleKeyNav = (e) => {
        if (!isOpen || flatResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % flatResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selected = flatResults[selectedIndex];
            if (selected.type === 'task') handleTaskClick(selected.data);
            else handleEmployeeClick(selected.data);
        }
    };

    const handleClear = () => {
        setQuery('');
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const handleEmployeeClick = () => {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(-1);
        navigate('/employees');
    };

    const handleTaskClick = (task) => {
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(-1);
        navigate(`/tasks/${task.id}`);
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
        setSelectedIndex(-1);
        if (e.target.value.trim().length >= 2) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    // Highlight matched text
    const highlightMatch = (text, searchQuery) => {
        if (!text || !searchQuery) return text;
        const q = searchQuery.toLowerCase().trim();
        const idx = text.toLowerCase().indexOf(q);
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <span className="bg-amber-200/60 dark:bg-amber-700/40 text-inherit rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</span>
                {text.slice(idx + q.length)}
            </>
        );
    };

    const hasResults = filteredResults.employees.length > 0 || filteredResults.tasks.length > 0;
    let flatIdx = -1; // Running index for keyboard navigation highlighting

    return (
        <div ref={containerRef} className="relative w-full max-w-[500px]">
            {/* Search Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-[#ea580c] transition-colors" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyNav}
                    onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
                    placeholder={role === 'manager' ? 'Search tasks, employees...' : 'Search tasks...'}
                    className="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/20 focus:border-[#ea580c]/60 dark:focus:border-[#ea580c]/50 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
                    {query ? (
                        <button
                            onClick={handleClear}
                            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded"
                        >
                            <X size={16} />
                        </button>
                    ) : (
                        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 shadow-sm">
                            <Command size={10} /> K
                        </kbd>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/30 overflow-hidden z-50">
                    {!hasResults ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <Search size={24} className="text-slate-300 dark:text-slate-600 mb-2.5" />
                            <p className="text-sm font-bold text-slate-700 dark:text-white">No results found</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Try adjusting your search terms
                            </p>
                        </div>
                    ) : (
                        <div className="max-h-[400px] overflow-y-auto">
                            {/* Employees Section */}
                            {filteredResults.employees.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <Users size={13} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employees</span>
                                    </div>
                                    {filteredResults.employees.map((emp) => {
                                        flatIdx++;
                                        const currentIdx = flatIdx;
                                        return (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleEmployeeClick(emp)}
                                                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/50 ${currentIdx === selectedIndex ? 'bg-[#ea580c]/5 dark:bg-[#ea580c]/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                            >
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white flex items-center justify-center font-bold text-[12px] shrink-0 shadow-sm">
                                                    {(emp.name || emp.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                                        {highlightMatch(emp.name, query)}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{emp.email} · {emp.activeTasks} active</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Tasks Section */}
                            {filteredResults.tasks.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        <ClipboardList size={13} className="text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tasks</span>
                                    </div>
                                    {filteredResults.tasks.map((task) => {
                                        flatIdx++;
                                        const currentIdx = flatIdx;
                                        return (
                                            <button
                                                key={task.id}
                                                onClick={() => handleTaskClick(task)}
                                                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/50 ${currentIdx === selectedIndex ? 'bg-[#ea580c]/5 dark:bg-[#ea580c]/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                            >
                                                {/* Priority dot */}
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority] || 'bg-slate-300'}`}></span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                                        {highlightMatch(task.title, query)}
                                                    </p>
                                                    {task.description && (
                                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                            {highlightMatch(task.description.slice(0, 80), query)}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_STYLES[task.status] || STATUS_STYLES.pending}`}>
                                                    {STATUS_LABELS[task.status] || task.status}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Footer hint */}
                            <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                    {flatResults.length} result{flatResults.length !== 1 ? 's' : ''} found
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                                    <span className="flex items-center gap-0.5"><kbd className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-[9px] font-bold shadow-sm">↑↓</kbd> navigate</span>
                                    <span className="flex items-center gap-0.5"><kbd className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-[9px] font-bold shadow-sm">↵</kbd> select</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
