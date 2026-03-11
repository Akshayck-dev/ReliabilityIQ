import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { Send, Calendar, ChevronDown, Loader2, Sparkles, AlertCircle, X, Check, ArrowDownRight, Minus, ArrowUpRight, CheckCircle2, UserCheck } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../features/auth/AuthContext';

// Pre-computed once at module level to avoid Math.random() during render
const PARTICLE_KEYFRAMES = [...Array(8)].map((_, i) => {
    const angle = (i * 45) * (Math.PI / 180);
    const dist = 80 + (i % 4 === 0 ? 30 : i % 4 === 1 ? 10 : i % 4 === 2 ? 20 : 40);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    return `@keyframes particle${i} { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(${x}px, ${y}px) scale(0); opacity: 0; } }`;
}).join('\n');

const AssignTask = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    // Read defaults from Settings localStorage preferences
    const [deadline, setDeadline] = useState(() => {
        const dueDays = parseInt(localStorage.getItem('riq_default_due_days') || '7', 10);
        const d = new Date();
        d.setDate(d.getDate() + dueDays);
        return d.toISOString().split('T')[0];
    });
    const [priority, setPriority] = useState(() => {
        const saved = localStorage.getItem('riq_default_priority');
        if (!saved) return 'medium';
        return saved.charAt(0).toUpperCase() + saved.slice(1);
    });
    const [parentTaskId, setParentTaskId] = useState('');

    // UI state
    const [employees, setEmployees] = useState([]);
    const [existingTasks, setExistingTasks] = useState([]);
    const [allRawTasks, setAllRawTasks] = useState([]);
    const [teamWorkload, setTeamWorkload] = useState([]);
    const [allEmployeeStats, setAllEmployeeStats] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Enhancements State
    const [validationErrors, setValidationErrors] = useState({});
    const [selectedEmployeeStats, setSelectedEmployeeStats] = useState(null);
    const [isImproving, setIsImproving] = useState(false);
    const [isSmartAssigning, setIsSmartAssigning] = useState(false);
    const [aiPreview, setAiPreview] = useState({ original: '', improved: '', show: false });
    const [showSuccess, setShowSuccess] = useState(false);
    const [submittedTitle, setSubmittedTitle] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load Employees
                const empData = await taskService.getAvailableEmployees();
                setEmployees(empData || []);

                // Load existing tasks for the linker dropdown AND workload counting
                const { supabase } = await import('../../lib/supabase');
                const { data: tasksData } = await supabase
                    .from('tasks')
                    .select('id, title, assigned_to, status, due_date')
                    .order('created_at', { ascending: false });
                setExistingTasks(tasksData || []);
                setAllRawTasks(tasksData || []);

                // Calculate Dynamic Workload
                if (empData && tasksData) {
                    const workload = empData.map(emp => {
                        const activeTasks = tasksData.filter(t => t.assigned_to === emp.id && t.status !== 'completed');
                        // Use email prefix if no name
                        const displayName = emp.email.split('@')[0];
                        const initials = displayName.substring(0, 2).toUpperCase();
                        return {
                            id: emp.id,
                            name: displayName,
                            tasks: activeTasks.length,
                            avatar: initials
                        };
                    });

                    // Sort to show highest workload first, limit to 3 for the UI cards
                    workload.sort((a, b) => b.tasks - a.tasks);
                    setTeamWorkload(workload.slice(0, 3));

                    // Store active task counts keyed by employee ID for the dropdown
                    const stats = {};
                    workload.forEach(emp => {
                        stats[emp.id] = emp.tasks;
                    });
                    setAllEmployeeStats(stats);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadInitialData();
    }, []);

    // Effect for updating selected employee workload preview
    useEffect(() => {
        if (!assignedTo || !allRawTasks.length) {
            setSelectedEmployeeStats(null);
            return;
        }

        const empTasks = allRawTasks.filter(t => t.assigned_to === assignedTo);
        const active = empTasks.filter(t => t.status !== 'completed').length;

        let overdue = 0;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        empTasks.forEach(t => {
            if (t.status !== 'completed' && t.due_date) {
                const due = new Date(t.due_date);
                due.setHours(0, 0, 0, 0);
                if (due < now) overdue++;
            }
        });

        // Mock reliability for design completeness
        const total = empTasks.length;
        const completedOnTime = empTasks.filter(t => t.status === 'completed').length;
        const reliability = total > 0 ? Math.round((completedOnTime / total) * 100) : 100;

        setSelectedEmployeeStats({
            active,
            overdue,
            reliability: Math.max(75, reliability) // Baseline mock constraint
        });

    }, [assignedTo, allRawTasks]);

    const validateForm = () => {
        const errors = {};
        if (!title.trim()) errors.title = "Task title is required.";
        if (!description || description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
        if (!assignedTo) errors.assignedTo = "Please select an employee.";
        if (!deadline) {
            errors.deadline = "Deadline is required.";
        } else {
            const selectedDate = new Date(deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // reset time
            if (selectedDate < today) {
                errors.deadline = "Deadline must be a future date.";
            }
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleImproveAI = async () => {
        if (!description || description.trim().length < 5) {
            toast.error("Please enter a basic description first.");
            return;
        }
        setIsImproving(true);
        try {
            const improved = await taskService.improveTaskDescription(title || "Generic Task", description);
            setAiPreview({ original: description, improved, show: true });
        } catch {
            toast.error("Failed to generate AI improvement.");
        } finally {
            setIsImproving(false);
        }
    };

    const acceptAiImprovement = () => {
        setDescription(aiPreview.improved);
        setAiPreview({ ...aiPreview, show: false });
        if (validationErrors.description) setValidationErrors({ ...validationErrors, description: null });
        toast.success("Description updated!");
    };

    const handleSmartAssign = async () => {
        if (!title.trim() || !description.trim()) {
            toast.error("Please add a title and description first so the AI understands the task.");
            return;
        }

        setIsSmartAssigning(true);
        try {
            // Build the payload summarizing the currently available employees and their workload
            const employeesPayload = teamWorkload.map(emp => ({ id: emp.id, name: emp.name, active_tasks: emp.tasks }));
            // Add other employees not in the top 3 workload chart just in case
            employees.forEach(emp => {
                if (!employeesPayload.find(e => e.id === emp.id)) {
                    employeesPayload.push({ id: emp.id, name: emp.full_name || emp.email.split('@')[0], active_tasks: allEmployeeStats[emp.id] || 0 })
                }
            });

            const { data, error } = await supabase.functions.invoke('openai-helper', {
                body: {
                    action: 'smart_assignment',
                    payload: {
                        task_title: title,
                        task_description: description,
                        employees: employeesPayload
                    }
                }
            });

            if (error) throw error;

            if (data?.success && data?.result?.suggested_employee_id) {
                setAssignedTo(data.result.suggested_employee_id);
                if (validationErrors.assignedTo) setValidationErrors({ ...validationErrors, assignedTo: null });
                toast.success(`AI suggested successfully! Reason: ${data.result.reason}`);
            } else {
                toast.error("AI couldn't find a suitable match.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to automatically assign employee.");
        } finally {
            setIsSmartAssigning(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await taskService.createTask({
                title,
                description,
                assigned_to: assignedTo,
                due_date: deadline,
                priority: priority.toLowerCase(),
                status: 'pending',
                manager_id: user.id,
                parent_task_id: parentTaskId || null
            });

            // Show success overlay
            setSubmittedTitle(title);
            setShowSuccess(true);

            // Delay redirect to let the animation play
            setTimeout(() => {
                navigate('/dashboard');
            }, 2200);
        } catch (err) {
            toast.error(err.message || "Failed to assign task.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8">
            {/* Breadcrumbs & Header */}
            <div className="mb-8">
                <div className="text-[13px] font-semibold mb-3">
                    <span className="text-slate-400 dark:text-slate-500">Tasks / </span>
                    <span className="text-slate-700 dark:text-slate-300">New Task</span>
                </div>
                <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">Assign New Task</h1>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Delegate responsibilities and set clear expectations for your team members.</p>
            </div>

            {/* Main Form Card */}
            <Card className="p-8 mb-10 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-100/60 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Task Title */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); if (validationErrors.title) setValidationErrors({ ...validationErrors, title: null }); }}
                            placeholder="e.g. Q4 System Infrastructure Audit"
                            className={`w-full px-4 py-3 bg-[#f8fafc] dark:bg-slate-800 border ${validationErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-[#ea580c]/50 focus:border-[#ea580c]'} rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                        />
                        {validationErrors.title && <p className="text-red-500 text-[11px] font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {validationErrors.title}</p>}
                    </div>

                    {/* Task Description */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Task Description</label>
                        <textarea
                            rows="4"
                            value={description}
                            onChange={(e) => { setDescription(e.target.value); if (validationErrors.description) setValidationErrors({ ...validationErrors, description: null }); }}
                            placeholder="Provide detailed instructions or specific goals for this task..."
                            className={`w-full px-4 py-3 bg-[#f8fafc] dark:bg-slate-800 border ${validationErrors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-[#ea580c]/50 focus:border-[#ea580c]'} rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors resize-none`}
                        ></textarea>
                        {validationErrors.description && <p className="text-red-500 text-[11px] font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {validationErrors.description}</p>}

                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={handleImproveAI}
                                disabled={isImproving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors disabled:opacity-50"
                            >
                                {isImproving ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : <Sparkles size={14} className="text-indigo-600" />}
                                {isImproving ? 'Generating...' : 'Improve with AI'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Assign To */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200">Assign To</label>
                                <button
                                    type="button"
                                    onClick={handleSmartAssign}
                                    disabled={isSmartAssigning}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md transition-colors disabled:opacity-50"
                                >
                                    {isSmartAssigning ? <Loader2 size={12} className="animate-spin text-violet-600" /> : <UserCheck size={12} className="text-violet-600" />}
                                    {isSmartAssigning ? 'Routing...' : 'Smart Assign'}
                                </button>
                            </div>
                            <div className="relative">
                                <select
                                    value={assignedTo}
                                    onChange={(e) => { setAssignedTo(e.target.value); if (validationErrors.assignedTo) setValidationErrors({ ...validationErrors, assignedTo: null }); }}
                                    className={`w-full px-4 py-3 bg-[#f8fafc] dark:bg-slate-800 border ${validationErrors.assignedTo ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-[#ea580c]/50 focus:border-[#ea580c]'} rounded-lg text-sm text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 transition-colors cursor-pointer block border-r-8 border-transparent`}
                                >
                                    <option value="" disabled>Select an employee</option>
                                    {employees.map(emp => {
                                        const activeCount = allEmployeeStats[emp.id] || 0;
                                        const isOverloaded = activeCount > 5;
                                        const displayName = emp.full_name || emp.email.split('@')[0];
                                        return (
                                            <option
                                                key={emp.id}
                                                value={emp.id}
                                                style={{ color: isOverloaded ? '#ef4444' : 'inherit' }}
                                            >
                                                {displayName} ({activeCount} active task{activeCount !== 1 ? 's' : ''})
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
                            </div>
                            {validationErrors.assignedTo && <p className="text-red-500 text-[11px] font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {validationErrors.assignedTo}</p>}

                            {/* Live Workload Preview */}
                            {selectedEmployeeStats && (
                                <div className="mt-3 p-3 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                                    <div className="text-center px-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active</p>
                                        <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{selectedEmployeeStats.active}</p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="text-center px-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Overdue</p>
                                        <p className={`text-[13px] font-bold ${selectedEmployeeStats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{selectedEmployeeStats.overdue}</p>
                                    </div>
                                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="text-center px-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Reliability</p>
                                        <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">{selectedEmployeeStats.reliability}%</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Deadline */}
                        <div>
                            <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Deadline</label>
                            <div className="relative">
                                {/* The placeholder color behaves differently on datetime, utilizing custom styles to align with Figma */}
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => { setDeadline(e.target.value); if (validationErrors.deadline) setValidationErrors({ ...validationErrors, deadline: null }); }}
                                    className={`w-full px-4 py-3 bg-[#f8fafc] dark:bg-slate-800 border ${validationErrors.deadline ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-[#ea580c]/50 focus:border-[#ea580c]'} rounded-lg text-sm text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full`}
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-900 dark:text-slate-400 pointer-events-none" />
                            </div>
                            {validationErrors.deadline && <p className="text-red-500 text-[11px] font-medium mt-1.5 flex items-center gap-1"><AlertCircle size={12} /> {validationErrors.deadline}</p>}
                        </div>
                    </div>

                    {/* Priority Level */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Priority Level</label>
                        <div className="flex bg-[#f8fafc] dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 gap-1.5">
                            {[
                                { level: 'Low', icon: ArrowDownRight, activeColor: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', inactiveColor: 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20' },
                                { level: 'Medium', icon: Minus, activeColor: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', inactiveColor: 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/20' },
                                { level: 'High', icon: ArrowUpRight, activeColor: 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800', inactiveColor: 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-900/20' }
                            ].map(({ level, activeColor, inactiveColor }) => {
                                const Icon = level === 'Low' ? ArrowDownRight : level === 'Medium' ? Minus : ArrowUpRight;
                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setPriority(level)}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[13px] font-bold rounded-md transition-all border ${priority === level
                                            ? `${activeColor} shadow-sm`
                                            : `border-transparent ${inactiveColor}`
                                            }`}
                                    >
                                        <Icon size={16} strokeWidth={priority === level ? 2.5 : 2} />
                                        {level}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Continuation Linker */}
                    <div>
                        <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Continuation of... <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                            <select
                                value={parentTaskId}
                                onChange={(e) => setParentTaskId(e.target.value)}
                                className="w-full px-4 py-3 bg-[#f8fafc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 focus:border-[#ea580c] transition-colors cursor-pointer block border-r-8 border-transparent"
                            >
                                <option value="">Select an existing task to link...</option>
                                {existingTasks.map(task => (
                                    <option key={task.id} value={task.id}>{task.title}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="pt-4 flex gap-4">
                        <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-[#0f172a] dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Cancel
                        </button>
                        <button disabled={isSubmitting} type="submit" className="flex-1 py-3 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-[#ea580c] hover:bg-orange-600 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {isSubmitting ? (
                                <>
                                    Assigning...
                                    <Loader2 size={16} className="animate-spin text-white" />
                                </>
                            ) : (
                                <>
                                    Assign Task
                                    <Send size={16} className="text-white fill-white" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Card>

            {/* Current Team Workload Section */}
            {teamWorkload.length > 0 && (
                <div>
                    <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-4 text-center sm:text-left">CURRENT TEAM WORKLOAD</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {teamWorkload.map((member) => (
                            <div key={member.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 bg-cover bg-center overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                    {member.avatar}
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-[#0f172a] dark:text-white truncate max-w-[120px]">{member.name}</h4>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{member.tasks} Active Task{member.tasks !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Preview Modal */}
            {aiPreview.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20">
                            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                                AI Text Improvement
                            </h3>
                            <button onClick={() => setAiPreview({ ...aiPreview, show: false })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded-md">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Original Context</h4>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[14px] leading-relaxed rounded-lg border border-slate-200 dark:border-slate-700">
                                    {aiPreview.original}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2">Improved Version</h4>
                                <div className="p-4 bg-indigo-50/40 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-200 text-[14px] font-medium leading-relaxed rounded-lg border border-indigo-100 dark:border-indigo-900/50 whitespace-pre-wrap">
                                    {aiPreview.improved}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
                            <button onClick={() => setAiPreview({ ...aiPreview, show: false })} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                                Discard
                            </button>
                            <button onClick={acceptAiImprovement} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow rounded-lg transition-all flex items-center gap-2">
                                <Check size={16} />
                                Apply Improvement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Overlay */}
            {showSuccess && <SuccessOverlay title={submittedTitle} />}
        </div>
    );
};

/* ── Success Overlay ── */
const SuccessOverlay = ({ title }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative flex flex-col items-center gap-6 p-10" style={{ animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            {/* Radiating rings */}
            <div className="relative">
                <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full border-2 border-green-400/30" style={{ animation: 'ping 1.5s ease-out infinite' }} />
                <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full border border-green-400/15" style={{ animation: 'ping 1.5s ease-out 0.3s infinite' }} />

                {/* Main checkmark circle */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30" style={{ animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
                </div>
            </div>

            {/* Text */}
            <div className="text-center" style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
                <h3 className="text-2xl font-bold text-white mb-1.5">Task Assigned!</h3>
                <p className="text-slate-300 text-sm max-w-[280px]">"<span className="font-semibold text-white">{title}</span>" has been successfully created and assigned.</p>
            </div>

            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
                <div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${['bg-green-400', 'bg-emerald-400', 'bg-orange-400', 'bg-blue-400', 'bg-yellow-400', 'bg-pink-400', 'bg-indigo-400', 'bg-cyan-400'][i]
                        }`}
                    style={{
                        top: '35%',
                        left: '50%',
                        animation: `particle${i} 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s both`,
                    }}
                />
            ))}
        </div>

        <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes scaleIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            @keyframes bounceIn { 0% { transform: scale(0); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes ping { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
            ${PARTICLE_KEYFRAMES}
        `}</style>
    </div>
);

export default AssignTask;
