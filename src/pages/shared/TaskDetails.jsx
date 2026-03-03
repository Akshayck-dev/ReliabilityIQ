import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import {
    Calendar, Clock, FileText, Info, History, Share2,
    CheckCircle2, TrendingUp, PlayCircle, UserPlus, Edit2, Archive, RotateCcw, Loader2,
    MessageSquare, Send, Link as LinkIcon
} from 'lucide-react';
import PriorityBadge from '../../components/ui/PriorityBadge';
import Badge from '../../components/ui/Badge';
import { taskService } from '../../services/taskService';
import { useAuth } from '../../features/auth/AuthContext';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal';

const TaskDetails = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const { user, role } = useAuth();

    const [rawTask, setRawTask] = useState(null);
    const [linkedTasks, setLinkedTasks] = useState({ parentTask: null, childTasks: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [newRemark, setNewRemark] = useState('');
    const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const [taskData, linkedData] = await Promise.all([
                    taskService.getTaskById(taskId),
                    taskService.getLinkedTasks(taskId)
                ]);

                setRawTask(taskData);
                setLinkedTasks(linkedData);
            } catch (err) {
                console.error("Failed to fetch task:", err);
                setError(err.message || "Failed to load task details");
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [taskId]);

    const handleMarkComplete = async () => {
        setActionLoading('complete');
        try {
            await taskService.markTaskComplete(taskId, user.email);
            // Optmistic UI Update
            setRawTask(prev => ({ ...prev, status: 'completed', completed_at: new Date().toISOString() }));
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleArchive = async () => {
        setShowArchiveModal(false);
        setActionLoading('archive');
        try {
            await taskService.archiveTask(taskId);
            toast.success('Task archived successfully');
            navigate('/tasks');
        } catch (err) {
            console.error(err);
            toast.error('Failed to archive task');
            setActionLoading(null);
        }
    };

    const handleRestore = async () => {
        setActionLoading('restore');
        try {
            await taskService.restoreTask(taskId);
            setRawTask(prev => ({ ...prev, is_archived: false }));
            toast.success('Task restored successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to restore task');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePostRemark = async () => {
        if (!newRemark.trim()) return;
        setIsSubmittingRemark(true);

        const remarkObj = {
            id: Date.now().toString(),
            text: newRemark.trim(),
            author_id: user.id,
            author_email: user.email,
            author_role: user?.user_metadata?.role || user.role || 'manager', // Fallbacks
            created_at: new Date().toISOString()
        };

        try {
            await taskService.addRemarkToTask(taskId, remarkObj);

            // Optimistic update
            setRawTask(prev => {
                const updatedRemarks = [...(prev.remarks || []), remarkObj];
                return { ...prev, remarks: updatedRemarks };
            });
            setNewRemark('');
            toast.success("Remark added!");
        } catch (err) {
            console.error("Failed to post remark:", err);
            toast.error("Failed: " + (err.message || "Could not post remark."));
        } finally {
            setIsSubmittingRemark(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 gap-4">
            <Loader2 size={32} className="animate-spin text-[#ea580c]" />
            <div className="text-sm font-medium text-slate-500 font-mono text-center">
                DEBUG INFO:<br />
                taskId: {taskId}<br />
                loading duration: ...
            </div>
        </div>
    );
    if (error || !rawTask) return (
        <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
            <h1 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Task Not Found</h1>
            <p className="text-red-500 max-w-lg text-center bg-red-50 dark:bg-red-900/30 p-4 rounded border border-red-200 dark:border-red-800">{error?.toString() || "Unknown error occurred while fetching the task"}</p>
        </div>
    );

    // Dynamic mapped data matching exactly the visual spec needed
    let delayStr = '0 days';
    if (rawTask.due_date) {
        const due = new Date(rawTask.due_date);
        const now = new Date();
        if (rawTask.status !== 'completed' && due < now) {
            const days = differenceInDays(now, due);
            delayStr = `${days} day${days !== 1 ? 's' : ''}`;
        }
    }

    const uiStatusMap = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };

    // Split remarks into system activity logs vs user discussions
    const allRemarks = rawTask.remarks || [];
    const systemActivity = allRemarks.filter(r => r.type === 'system').map((sys, idx) => ({
        id: sys.id,
        action: sys.text,
        user: sys.author_email?.split('@')[0] || 'System',
        date: format(new Date(sys.created_at), 'MMM dd, yyyy').toUpperCase(),
        time: format(new Date(sys.created_at), 'h:mm a'),
        icon: idx === 0 ? UserPlus : (sys.text.includes('Completed') ? CheckCircle2 : PlayCircle),
        iconColor: idx === 0 ? "text-slate-400" : (sys.text.includes('Completed') ? "text-green-500" : "text-amber-500"),
        iconBg: "bg-slate-50",
        borderColor: "border-slate-200"
    }));

    // If no system logs found organically, mock an initial creation one to prevent empty UI
    const defaultActivity = [{
        id: 'initial_1',
        action: "Task created in system",
        user: rawTask.creator?.email?.split('@')[0] || 'Manager',
        date: format(new Date(rawTask.created_at), 'MMM dd, yyyy').toUpperCase(),
        time: "System",
        icon: UserPlus,
        iconColor: "text-slate-400",
        iconBg: "bg-slate-50",
        borderColor: "border-slate-200"
    }];

    const userDiscussions = allRemarks.filter(r => r.type !== 'system');

    const task = {
        id: rawTask.id,
        title: rawTask.title,
        status: uiStatusMap[rawTask.status] || 'Pending',
        priority: (rawTask.priority || 'medium').charAt(0).toUpperCase() + (rawTask.priority || 'medium').slice(1),
        description: rawTask.description || 'No description provided.',
        assignedDate: format(new Date(rawTask.created_at), 'MMM dd, yyyy'),
        deadlineDate: rawTask.due_date ? format(new Date(rawTask.due_date), 'MMM dd, yyyy') : 'No deadline',
        estimatedDuration: rawTask.due_date ? `${differenceInDays(new Date(rawTask.due_date), new Date(rawTask.created_at))} days` : 'Ongoing',
        delay: delayStr,
        reliabilityImpact: '+2%', // Kept visual mock for now
        assignee: {
            name: rawTask.assignee?.email || 'Unknown',
            role: rawTask.assignee?.role || 'Employee',
            avatar: (rawTask.assignee?.email?.[0] || 'U').toUpperCase()
        },
        activity: systemActivity.length > 0 ? systemActivity : defaultActivity,
        remarks: userDiscussions
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

            {/* Breadcrumbs */}
            <div className="mb-6 flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                <Link to="/tasks" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">My Tasks</Link>
                <span className="mx-2 text-slate-300 dark:text-slate-600">›</span>
                <span className="text-[#ea580c] dark:text-[#f97316]">Task Details</span>
            </div>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h1 className="text-[32px] font-extrabold text-[#0f172a] dark:text-white tracking-tight">{task.title}</h1>
                        <div className="flex items-center gap-2 mt-1 md:mt-0">
                            {/* Custom mapping for the blue In Progress badge here to match Figma exactly */}
                            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                {task.status}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                {task.priority} Priority
                            </span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Task ID: <span className="text-slate-700 dark:text-slate-300 font-semibold">{task.id}</span></p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                        <Share2 size={16} />
                        Share
                    </button>
                    <button
                        onClick={handleMarkComplete}
                        disabled={task.status === 'Completed' || actionLoading === 'complete'}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#ea580c] hover:bg-orange-600 border border-transparent rounded-lg text-sm font-bold text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {actionLoading === 'complete' ? <Loader2 size={16} className="animate-spin text-white" /> : <CheckCircle2 size={16} className="text-white" />}
                        {task.status === 'Completed' ? 'Completed' : 'Mark Complete'}
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left Column (Information) */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* Description Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <FileText size={20} className="text-[#ea580c] dark:text-[#f97316]" />
                            <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Description</h2>
                        </div>
                        <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                            {task.description}
                        </p>
                    </Card>

                    {/* Key Information Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Info size={20} className="text-[#ea580c] dark:text-[#f97316]" />
                            <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Key Information</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Assigned Date</p>
                                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-[15px]">
                                    <Calendar size={18} className="text-slate-400 dark:text-slate-500" />
                                    {task.assignedDate}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Deadline</p>
                                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-[15px]">
                                    <Calendar size={18} className="text-red-500 dark:text-red-400" />
                                    {task.deadlineDate}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Estimated Duration</p>
                                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-semibold text-[15px]">
                                    <Clock size={18} className="text-slate-400 dark:text-slate-500" />
                                    {task.estimatedDuration}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Linked Tasks Section */
                        (linkedTasks.parentTask || linkedTasks.childTasks.length > 0) && (
                            <Card className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <LinkIcon className="text-[#ea580c] dark:text-[#f97316]" />
                                    <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Related Tasks</h2>
                                </div>

                                <div className="space-y-4">
                                    {linkedTasks.parentTask && (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Continuation Of</p>
                                            <a href={`/tasks/${linkedTasks.parentTask.id}`} className="text-[#0f172a] dark:text-slate-200 font-semibold text-sm hover:text-[#ea580c] transition-colors flex items-center gap-2">
                                                {linkedTasks.parentTask.title}
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${linkedTasks.parentTask.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                    {linkedTasks.parentTask.status.replace('_', ' ')}
                                                </span>
                                            </a>
                                        </div>
                                    )}

                                    {linkedTasks.childTasks.length > 0 && (
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Follow-up Tasks</p>
                                            <div className="space-y-2">
                                                {linkedTasks.childTasks.map(child => (
                                                    <a key={child.id} href={`/tasks/${child.id}`} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded transition-colors group">
                                                        <span className="text-[#0f172a] dark:text-slate-200 font-medium text-sm group-hover:text-[#ea580c] transition-colors">{child.title}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${child.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                            }`}>
                                                            {child.status.replace('_', ' ')}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                    {/* Activity History Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-8">
                            <History size={20} className="text-[#ea580c] dark:text-[#f97316]" />
                            <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Activity History</h2>
                        </div>

                        {/* Timeline */}
                        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-[1.125rem] space-y-8 pb-4">
                            {task.activity.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.id} className="relative pl-8">
                                        {/* Timeline Dot/Icon */}
                                        <div className={`absolute -left-[21px] top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-slate-900 ${item.borderColor === 'border-slate-200' ? 'border-slate-200 dark:border-slate-700' : item.borderColor}`}>
                                            <Icon size={18} className={item.iconColor === 'text-slate-400' ? 'text-slate-400 dark:text-slate-500' : item.iconColor} />
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pt-0.5">
                                            <div>
                                                <p className="text-[14px] font-bold text-[#0f172a] dark:text-slate-200">{item.action}</p>
                                                <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">by {item.user}</p>
                                            </div>
                                            <div className="text-right flex flex-col sm:items-end mt-1 sm:mt-0">
                                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.date}</span>
                                                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{item.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Discussion & Remarks Card */}
                    <Card className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare size={20} className="text-[#ea580c]" />
                            <h2 className="text-lg font-bold text-[#0f172a]">Discussion & Remarks</h2>
                        </div>

                        {/* Remarks Feed */}
                        <div className="flex flex-col gap-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                            {task.remarks.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                    No remarks yet. Start the discussion below.
                                </p>
                            ) : (
                                task.remarks.map((remark) => {
                                    const isMine = remark.author_id === user?.id;
                                    return (
                                        <div key={remark.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[80%] ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-baseline gap-2 mb-1 px-1">
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        {isMine ? 'You' : remark.author_email?.split('@')[0] || 'Unknown User'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                                        {format(new Date(remark.created_at), 'MMM d, h:mm a')}
                                                    </span>
                                                </div>
                                                <div className={`px-4 py-2.5 rounded-2xl text-[14px] ${isMine
                                                    ? 'bg-[#ea580c] text-white rounded-tr-sm'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                                                    }`}>
                                                    {remark.text}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="flex gap-3">
                            <textarea
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                                placeholder="Add a remark or update..."
                                rows="2"
                                className="flex-1 resize-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 focus:border-[#ea580c] transition-colors"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handlePostRemark();
                                    }
                                }}
                            />
                            <button
                                onClick={handlePostRemark}
                                disabled={isSubmittingRemark || !newRemark.trim()}
                                className="shrink-0 self-end w-12 h-12 bg-[#0f172a] dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                {isSubmittingRemark ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Right Column (Sidebar Controls) */}
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">

                    {/* Progress Overview Card */}
                    <Card className="p-6">
                        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Progress Overview</h3>

                        {/* Current Delay Block */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <Clock size={20} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Current Delay</p>
                                <p className="text-lg font-bold text-[#0f172a] dark:text-white">{task.delay}</p>
                            </div>
                        </div>

                        {/* Reliability Impact Block */}
                        <div className="bg-[#fff7ed] dark:bg-orange-950/30 rounded-xl p-5 border border-orange-100/50 dark:border-orange-900/30">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp size={16} className="text-[#ea580c] dark:text-[#f97316]" />
                                <h4 className="text-[11px] font-bold text-[#ea580c] dark:text-[#f97316] uppercase tracking-widest">Reliability Impact</h4>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-[#ea580c] dark:text-[#f97316]">{task.reliabilityImpact}</span>
                                <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Potential Score Increase</span>
                            </div>
                        </div>
                    </Card>

                    {/* Action Block Card */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleMarkComplete}
                            disabled={task.status === 'Completed' || actionLoading === 'complete'}
                            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#ea580c] hover:bg-orange-600 border border-transparent rounded-lg text-[15px] font-bold text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading === 'complete' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            {task.status === 'Completed' ? 'Completed' : 'Mark Complete'}
                        </button>
                        {role === 'manager' && (
                            <Card className="overflow-hidden">
                                <button className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[14px] font-bold text-slate-700 dark:text-slate-300 transition-colors border-b border-slate-100 dark:border-slate-800">
                                    <Edit2 size={16} />
                                    Edit Task
                                </button>
                                {rawTask.is_archived ? (
                                    <button
                                        onClick={handleRestore}
                                        disabled={actionLoading === 'restore'}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white dark:bg-slate-900 hover:bg-green-50 dark:hover:bg-green-900/20 text-[14px] font-bold text-green-600 dark:text-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === 'restore' ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                                        Restore Task
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setShowArchiveModal(true)}
                                        disabled={actionLoading === 'archive'}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-[14px] font-bold text-amber-600 dark:text-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {actionLoading === 'archive' ? <Loader2 size={16} className="animate-spin" /> : <Archive size={16} />}
                                        Archive Task
                                    </button>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Assigned To Card */}
                    <Card className="p-6">
                        <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Assigned To</h3>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 bg-cover bg-center overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                {task.assignee.avatar}
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold text-[#0f172a] dark:text-white">{task.assignee.name}</h4>
                                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{task.assignee.role}</p>
                            </div>
                        </div>
                    </Card>

                </div>

            </div>

            {/* Archive Confirmation Modal */}
            <ConfirmModal
                isOpen={showArchiveModal}
                onConfirm={handleArchive}
                onCancel={() => setShowArchiveModal(false)}
                title="Archive this task?"
                message="This task will be moved to the archive. You can restore it anytime from the Archived tab."
                confirmLabel="Archive Task"
                cancelLabel="Keep Active"
                variant="warning"
                icon={Archive}
                loading={actionLoading === 'archive'}
            />
        </div>
    );
};

export default TaskDetails;
