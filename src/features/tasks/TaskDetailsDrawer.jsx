import React, { useState, useEffect } from 'react';
import {
    X, Bold, Italic, Underline, Link, List, AlignLeft,
    Trash2, CheckSquare, Square, Plus, Lock
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../auth/AuthContext';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateTaskStatus } from '../tasks/tasksSlice';

/* ─── Priority Badge ──────────────────────────────────────────────────────── */
const PriorityBadge = ({ priority }) => {
    const styles = {
        high: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        low: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold capitalize ${styles[priority] || styles.low}`}>
            {priority || 'low'}
        </span>
    );
};

/* ─── Status Badge ─────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
    const map = {
        pending: { label: 'To Do', cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
        in_progress: { label: 'In Progress', cls: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
        review: { label: 'In Review', cls: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
        completed: { label: 'Completed', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' }
    };
    const { label, cls } = map[status] || map.pending;
    return <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${cls}`}>{label}</span>;
};

/* ─── Read-Only Field ─────────────────────────────────────────────────────── */
const ReadField = ({ label, children }) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="text-sm text-slate-800 dark:text-slate-200">{children}</div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const TaskDetailsDrawer = ({ taskId, onClose }) => {
    const { user, role } = useAuth();
    const dispatch = useDispatch();
    const isManager = role === 'manager';

    const [task, setTask] = useState(null);
    const [originalTask, setOriginalTask] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Subtasks & Comments
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    // Saving state
    const [isSaving, setIsSaving] = useState(false);
    // Employee-only: status update
    const [empStatus, setEmpStatus] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!taskId) return;
            setLoading(true);
            setFetchError(null);
            try {
                const { data: taskData, error: taskError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('id', taskId)
                    .single();

                if (taskError) throw taskError;

                setTask(taskData);
                setOriginalTask(taskData);
                setEmpStatus(taskData.status || 'pending');

                const existingSubtasksRemark = (taskData.remarks || []).find(r => r.type === 'subtasks');
                setSubtasks(existingSubtasksRemark ? existingSubtasksRemark.items : []);

                const userDiscussions = (taskData.remarks || []).filter(r => r.type !== 'system' && r.type !== 'subtasks');
                setComments(userDiscussions);

                // Non-blocking employee list (managers only need it for the assignee drop-down)
                if (isManager) {
                    try {
                        const teamData = await taskService.getAvailableEmployees();
                        setEmployees(teamData || []);
                    } catch {
                        setEmployees([]);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch task details:', err);
                setFetchError(err.message || 'Failed to load task.');
                toast.error('Failed to load task details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [taskId, isManager]);

    /* ── Manager: Save all changes ── */
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates = {};
            if (task.title !== originalTask.title) updates.title = task.title;
            if (task.description !== originalTask.description) updates.description = task.description;
            if (task.priority !== originalTask.priority) updates.priority = task.priority;
            if (task.due_date !== originalTask.due_date) updates.due_date = task.due_date || null;

            if (task.assigned_to !== originalTask.assigned_to) {
                await taskService.assignTask(taskId, task.assigned_to, user.email);
            }

            if (task.status !== originalTask.status) {
                await dispatch(updateTaskStatus({
                    taskId,
                    currentStatus: originalTask.status,
                    newStatus: task.status,
                    userEmail: user.email
                })).unwrap();
            }

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
                if (error) throw error;
            }

            toast.success('Task updated successfully!');
            onClose();
        } catch (err) {
            console.error('Save failed:', err);
            toast.error('Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    /* ── Employee: Update only their own status ── */
    const handleEmployeeStatusSave = async () => {
        if (empStatus === task.status) { toast('No changes to save.'); return; }
        setIsSaving(true);
        try {
            await dispatch(updateTaskStatus({
                taskId,
                currentStatus: task.status,
                newStatus: empStatus,
                userEmail: user.email
            })).unwrap();
            toast.success('Status updated!');
            onClose();
        } catch (err) {
            console.error('Status update failed:', err);
            toast.error('Failed to update status.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await taskService.deleteTask(taskId);
            toast.success('Task deleted');
            onClose();
        } catch {
            toast.error('Failed to delete task');
        }
    };

    const handleFieldChange = (field, value) => {
        setTask(prev => ({ ...prev, [field]: value }));
    };

    // Subtasks
    const handleAddSubtask = async () => {
        if (!newSubtask.trim()) return;
        const newItem = { id: Date.now().toString(), title: newSubtask.trim(), completed: false };
        const newItems = [...subtasks, newItem];
        setSubtasks(newItems);
        setNewSubtask('');
        await persistSubtasks(newItems);
    };

    const handleToggleSubtask = async (subtaskId) => {
        const newItems = subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        setSubtasks(newItems);
        await persistSubtasks(newItems);
    };

    const persistSubtasks = async (newItems) => {
        try {
            const { data: tData } = await supabase.from('tasks').select('remarks').eq('id', taskId).single();
            const existingSubtasksRemark = (tData?.remarks || []).find(r => r.type === 'subtasks');
            if (existingSubtasksRemark) {
                await supabase.from('tasks').update({
                    remarks: tData.remarks.map(r => r.id === existingSubtasksRemark.id ? { ...r, items: newItems } : r)
                }).eq('id', taskId);
            } else {
                const newRemarkObj = { id: Date.now().toString(), type: 'subtasks', items: newItems, created_at: new Date().toISOString() };
                await supabase.from('tasks').update({ remarks: [...(tData?.remarks || []), newRemarkObj] }).eq('id', taskId);
            }
        } catch (err) {
            console.error('Subtask persist failed', err);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const remarkObj = {
            id: Date.now().toString(),
            text: newComment.trim(),
            author_id: user.id,
            author_email: user.email,
            author_role: user?.user_metadata?.role || role || 'employee',
            created_at: new Date().toISOString()
        };
        try {
            await taskService.addRemarkToTask(taskId, remarkObj);
            setComments(prev => [...prev, remarkObj]);
            setNewComment('');
        } catch {
            toast.error('Failed to add comment.');
        }
    };

    /* ─── Render ──────────────────────────────────────────────────────────── */
    return (
        <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-[#0f172a] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${taskId ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Task Details</h2>
                    {!isManager && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            <Lock size={10} /> View Only
                        </span>
                    )}
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>

            {/* Body */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            ) : fetchError ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <p className="text-sm font-semibold text-red-500">Failed to load task</p>
                    <p className="text-xs text-slate-400">{fetchError}</p>
                    <button onClick={onClose} className="text-sm text-blue-600 hover:underline">Close</button>
                </div>
            ) : !task ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-slate-400">Task not found.</p>
                </div>
            ) : isManager ? (
                /* ════ MANAGER: Full Edit View ════ */
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Title</label>
                        <input
                            type="text"
                            value={task.title || ''}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-1 p-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                {[Bold, Italic, Underline, Link, List, AlignLeft].map((Icon, i) => (
                                    <button key={i} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Icon size={14} className="text-slate-600 dark:text-slate-400" /></button>
                                ))}
                            </div>
                            <textarea
                                value={task.description || ''}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Status / Assignee / Priority / Deadline */}
                    <div className="grid grid-cols-[100px_1fr] gap-y-4 items-center">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                        <select value={task.status || 'pending'} onChange={(e) => handleFieldChange('status', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500">
                            <option value="pending">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="completed">Completed</option>
                        </select>

                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assignee</label>
                        <select value={task.assigned_to || ''} onChange={(e) => handleFieldChange('assigned_to', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500">
                            <option value="" disabled>Select Assignee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.email?.split('@')[0] || 'Unknown'}</option>
                            ))}
                        </select>

                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                            {['low', 'medium', 'high'].map(pLevel => {
                                const isSelected = task.priority === pLevel;
                                return (
                                    <button key={pLevel} onClick={() => handleFieldChange('priority', pLevel)}
                                        className={`flex-1 text-xs font-semibold py-1 rounded capitalize transition-colors ${isSelected
                                            ? (pLevel === 'high' ? 'bg-red-500 text-white' : pLevel === 'medium' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white')
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                        {pLevel}
                                    </button>
                                );
                            })}
                        </div>

                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Deadline</label>
                        <input type="date" value={task.due_date ? task.due_date.split('T')[0] : ''}
                            onChange={(e) => handleFieldChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
                    </div>

                    {/* Subtasks */}
                    <SubtaskSection subtasks={subtasks} newSubtask={newSubtask} onNewChange={setNewSubtask} onAdd={handleAddSubtask} onToggle={handleToggleSubtask} />

                    {/* Comments */}
                    <CommentSection comments={comments} newComment={newComment} onNewChange={setNewComment} onAdd={handleAddComment} />
                </div>
            ) : (
                /* ════ EMPLOYEE: Read-Only View ════ */
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* Info banner */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                        <Lock size={14} className="text-blue-500 shrink-0" />
                        <p className="text-[12px] text-blue-700 dark:text-blue-300 font-medium">
                            Task details are set by your manager. You can update the status and add comments.
                        </p>
                    </div>

                    {/* Title */}
                    <ReadField label="Task Title">
                        <p className="font-semibold text-[15px]">{task.title}</p>
                    </ReadField>

                    {/* Description */}
                    <ReadField label="Description">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                            {task.description || '—'}
                        </p>
                    </ReadField>

                    <div className="grid grid-cols-2 gap-4">
                        <ReadField label="Priority"><PriorityBadge priority={task.priority} /></ReadField>
                        <ReadField label="Current Status"><StatusBadge status={task.status} /></ReadField>
                        <ReadField label="Deadline">
                            <span className="text-sm font-medium">
                                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                            </span>
                        </ReadField>
                        <ReadField label="Assigned By">
                            <span className="text-sm font-medium">{task.created_by_email?.split('@')[0] || 'Manager'}</span>
                        </ReadField>
                    </div>

                    {/* Employee Status Update */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Update My Status</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                            {[
                                { val: 'pending', label: 'To Do' },
                                { val: 'in_progress', label: 'In Progress' },
                                { val: 'review', label: 'Review' },
                                { val: 'completed', label: 'Done' }
                            ].map(({ val, label }) => (
                                <button key={val} onClick={() => setEmpStatus(val)}
                                    className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-colors ${empStatus === val
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                        }`}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subtasks — read/toggle only */}
                    <SubtaskSection subtasks={subtasks} newSubtask={newSubtask} onNewChange={setNewSubtask} onAdd={handleAddSubtask} onToggle={handleToggleSubtask} />

                    {/* Comments */}
                    <CommentSection comments={comments} newComment={newComment} onNewChange={setNewComment} onAdd={handleAddComment} />
                </div>
            )}

            {/* Footer Actions */}
            {!loading && !fetchError && task && (
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shrink-0 flex flex-col gap-3">
                    {isManager ? (
                        <>
                            <button onClick={handleSave} disabled={isSaving}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button onClick={handleDelete} disabled={isSaving}
                                className="w-full py-2.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-900 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg font-bold transition-colors disabled:opacity-50">
                                Delete Task
                            </button>
                        </>
                    ) : (
                        <button onClick={handleEmployeeStatusSave} disabled={isSaving || empStatus === task.status}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-colors disabled:opacity-50">
                            {isSaving ? 'Updating...' : 'Update Status'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

/* ─── Shared Subtask Section ─────────────────────────────────────────────── */
const SubtaskSection = ({ subtasks, newSubtask, onNewChange, onAdd, onToggle }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subtasks</label>
        <div className="space-y-2 mb-2">
            {subtasks.map(s => (
                <div key={s.id} className="flex items-center gap-2 group cursor-pointer" onClick={() => onToggle(s.id)}>
                    <button className="text-slate-400 group-hover:text-blue-500 transition-colors focus:outline-none">
                        {s.completed ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
                    </button>
                    <span className={`text-sm ${s.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                        {s.title}
                    </span>
                </div>
            ))}
        </div>
        <div className="flex items-center gap-2">
            <Plus size={16} className="text-slate-400 shrink-0" />
            <input type="text" placeholder="Add Subtask" value={newSubtask} onChange={(e) => onNewChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                className="text-sm bg-transparent border-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none w-full" />
        </div>
    </div>
);

/* ─── Shared Comment Section ─────────────────────────────────────────────── */
const CommentSection = ({ comments, newComment, onNewChange, onAdd }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Comments</label>
        <div className="space-y-4 mb-4">
            {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {(c.author_email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.author_email?.split('@')[0] || 'Unknown'}</span>
                            <span className="text-xs text-slate-400">{format(new Date(c.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{c.text}</p>
                    </div>
                </div>
            ))}
        </div>
        <div className="flex gap-2 items-center">
            <input type="text" value={newComment} onChange={(e) => onNewChange(e.target.value)}
                placeholder="Add a comment..." onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500" />
            <button onClick={onAdd} disabled={!newComment.trim()}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50">
                Post
            </button>
        </div>
    </div>
);

export default TaskDetailsDrawer;
