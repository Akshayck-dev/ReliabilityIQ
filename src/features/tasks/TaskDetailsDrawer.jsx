import React, { useState, useEffect } from 'react';
import { X, Bold, Italic, Underline, Link, List, AlignLeft, Trash2, CheckSquare, Square, Plus } from 'lucide-react';
import { taskService } from '../../services/taskService';
import { useAuth } from '../auth/AuthContext';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { updateTaskStatus } from '../tasks/tasksSlice';

const TaskDetailsDrawer = ({ taskId, onClose }) => {
    const { user } = useAuth();
    const dispatch = useDispatch();

    const [task, setTask] = useState(null);
    const [originalTask, setOriginalTask] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Subtasks & Comments
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtask, setNewSubtask] = useState('');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    // Saving state
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!taskId) return;
            setLoading(true);
            try {
                const [taskData, teamData] = await Promise.all([
                    taskService.getTaskById(taskId),
                    taskService.getEmployees(user.email)
                ]);

                setTask(taskData);
                setOriginalTask(taskData);
                setEmployees(teamData || []);

                // Parse subtasks
                const existingSubtasksRemark = (taskData.remarks || []).find(r => r.type === 'subtasks');
                setSubtasks(existingSubtasksRemark ? existingSubtasksRemark.items : []);

                // Parse comments
                const userDiscussions = (taskData.remarks || []).filter(r => r.type !== 'system' && r.type !== 'subtasks');
                setComments(userDiscussions);

            } catch (err) {
                console.error("Failed to fetch:", err);
                toast.error("Failed to load task details");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [taskId, user.email]);

    const handleFieldChange = (field, value) => {
        setTask(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updates = {};
            if (task.title !== originalTask.title) updates.title = task.title;
            if (task.description !== originalTask.description) updates.description = task.description;
            if (task.priority !== originalTask.priority) updates.priority = task.priority;
            if (task.due_date !== originalTask.due_date) updates.due_date = task.due_date || null;

            // Re-assign if changed
            if (task.assigned_to !== originalTask.assigned_to) {
                await taskService.assignTask(taskId, task.assigned_to, user.email);
            }

            // Update status if changed
            if (task.status !== originalTask.status) {
                await dispatch(updateTaskStatus({ taskId, currentStatus: originalTask.status, newStatus: task.status, userEmail: user.email })).unwrap();
            }

            // Base updates
            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
                if (error) throw error;
            }

            toast.success("Task updated successfully!");
            onClose();
        } catch (err) {
            console.error("Save failed:", err);
            toast.error("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await taskService.deleteTask(taskId);
            toast.success("Task deleted");
            onClose();
        } catch (err) {
            toast.error("Failed to delete task");
        }
    };

    // Subtask Logic
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
            const tData = await taskService.getTaskById(taskId);
            const existingSubtasksRemark = (tData.remarks || []).find(r => r.type === 'subtasks');
            if (existingSubtasksRemark) {
                await supabase.from('tasks').update({
                    remarks: tData.remarks.map(r => r.id === existingSubtasksRemark.id ? { ...r, items: newItems } : r)
                }).eq('id', taskId);
            } else {
                const newRemarkObj = { id: Date.now().toString(), type: 'subtasks', items: newItems, created_at: new Date().toISOString() };
                await supabase.from('tasks').update({ remarks: [...(tData.remarks || []), newRemarkObj] }).eq('id', taskId);
            }
        } catch (err) {
            console.error("Subtask persist failed", err);
        }
    };

    // Comment Logic
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const remarkObj = {
            id: Date.now().toString(),
            text: newComment.trim(),
            author_id: user.id,
            author_email: user.email,
            author_role: user?.user_metadata?.role || user.role || 'employee',
            created_at: new Date().toISOString()
        };

        try {
            await taskService.addRemarkToTask(taskId, remarkObj);
            setComments(prev => [...prev, remarkObj]);
            setNewComment('');
        } catch (err) {
            toast.error("Failed to add comment.");
        }
    };

    return (
        <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-[#0f172a] shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${taskId ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Task Details</h2>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>

            {loading || !task ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ea580c]"></div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Task Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Task Title</label>
                        <input
                            type="text"
                            value={task.title || ''}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#ea580c] focus:ring-1 focus:ring-[#ea580c]"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-white dark:bg-slate-900">
                            {/* Fake Toolbar */}
                            <div className="flex items-center gap-1 p-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Bold size={14} className="text-slate-600 dark:text-slate-400" /></button>
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Italic size={14} className="text-slate-600 dark:text-slate-400" /></button>
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Underline size={14} className="text-slate-600 dark:text-slate-400" /></button>
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Link size={14} className="text-slate-600 dark:text-slate-400" /></button>
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><List size={14} className="text-slate-600 dark:text-slate-400" /></button>
                                <button className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><AlignLeft size={14} className="text-slate-600 dark:text-slate-400" /></button>
                            </div>
                            <textarea
                                value={task.description || ''}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                rows={4}
                                className="w-full px-3 py-2 text-sm text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Status, Assignee, Priority, Deadline Grid */}
                    <div className="grid grid-cols-[100px_1fr] gap-y-4 items-center">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                        <select
                            value={task.status || 'pending'}
                            onChange={(e) => handleFieldChange('status', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#ea580c]"
                        >
                            <option value="pending">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">In Review</option>
                            <option value="completed">Completed</option>
                        </select>

                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assignee</label>
                        <select
                            value={task.assigned_to || ''}
                            onChange={(e) => handleFieldChange('assigned_to', e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#ea580c]"
                        >
                            <option value="" disabled>Select Assignee</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.email?.split('@')[0] || 'Unknown'} (Avatar)</option>
                            ))}
                        </select>

                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-1">
                            {['low', 'medium', 'high'].map(pLevel => {
                                const isSelected = task.priority === pLevel;
                                return (
                                    <button
                                        key={pLevel}
                                        onClick={() => handleFieldChange('priority', pLevel)}
                                        className={`flex-1 text-xs font-semibold py-1 rounded capitalize transition-colors ${isSelected
                                                ? (pLevel === 'high' ? 'bg-red-500 text-white' : pLevel === 'medium' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white')
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        {pLevel}
                                    </button>
                                )
                            })}
                        </div>

                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Deadline</label>
                        <input
                            type="date"
                            value={task.due_date ? task.due_date.split('T')[0] : ''}
                            onChange={(e) => handleFieldChange('due_date', e.target.value ? new Date(e.target.value).toISOString() : null)}
                            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#ea580c]"
                        />
                    </div>

                    {/* Subtasks */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subtasks</label>
                        <div className="space-y-2 mb-2">
                            {subtasks.map(s => (
                                <div key={s.id} className="flex items-center gap-2 group cursor-pointer" onClick={() => handleToggleSubtask(s.id)}>
                                    <button className="text-slate-400 group-hover:text-[#ea580c] transition-colors focus:outline-none">
                                        {s.completed ? <CheckSquare size={16} className="text-emerald-500" /> : <Square size={16} />}
                                    </button>
                                    <span className={`text-sm ${s.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {s.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <Plus size={16} className="text-slate-400" />
                            <input
                                type="text"
                                placeholder="Add Subtask"
                                value={newSubtask}
                                onChange={(e) => setNewSubtask(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                                className="text-sm bg-transparent border-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none w-full"
                            />
                        </div>
                    </div>

                    {/* Comments */}
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
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {c.author_email?.split('@')[0] || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {format(new Date(c.created_at), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                            {c.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#ea580c]"
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                            >
                                Post
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* Bottom Actions Fixed Area */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shrink-0 flex flex-col gap-3">
                <button
                    onClick={handleSave}
                    disabled={isSaving || loading}
                    className="w-full py-2.5 bg-[#ea580c] hover:bg-orange-600 rounded-md text-white font-bold transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isSaving || loading}
                    className="w-full py-2.5 bg-white dark:bg-transparent border border-red-200 dark:border-red-900 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md font-bold transition-colors disabled:opacity-50"
                >
                    Delete Task
                </button>
            </div>

        </div>
    );
};

export default TaskDetailsDrawer;
