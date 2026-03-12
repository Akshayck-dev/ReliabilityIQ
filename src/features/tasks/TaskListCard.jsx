import React from 'react';
import PriorityBadge from '../../components/ui/PriorityBadge';
import { getDueStatus } from '../../utils/dueDateUtils';
import { Calendar, User2, MessageSquare, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

const TaskListCard = ({ task, onClick, isManager }) => {
    const dueStatus = getDueStatus(task);
    
    // Calculate subtask progress
    const subtaskRemark = (task.remarks || []).find(r => r.type === 'subtasks');
    const subtasks = subtaskRemark?.items || [];
    const completedCount = subtasks.filter(s => s.completed).length;
    const progressPercent = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;
    
    const commentCount = (task.remarks || []).filter(r => r.type !== 'system' && r.type !== 'subtasks').length;

    const statusStyles = {
        pending: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50',
        in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30',
        review: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/30',
        completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30',
    };

    const dueStyles = {
        'overdue': 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30',
        'due_today': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30',
        'due_soon': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30'
    };

    return (
        <div 
            onClick={() => onClick(task.id)}
            className="group flex flex-col md:flex-row gap-6 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-0 relative overflow-hidden"
        >
            {/* Status Indicator Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5 ${
                task.status === 'completed' ? 'bg-emerald-500' : 
                task.status === 'in_progress' ? 'bg-blue-500' : 
                task.status === 'review' ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}></div>

            {/* Left Content: Title, Description, Metadata */}
            <div className="flex-1 space-y-3 pl-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {task.title}
                            </h3>
                            {task.parent_status && task.parent_status !== 'completed' && (
                                <span title="Blocked by dependency" className="text-rose-500 animate-pulse">
                                    <AlertCircle size={14} />
                                </span>
                            )}
                        </div>
                        {task.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed max-w-2xl">
                                {task.description}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusStyles[task.status] || statusStyles.pending}`}>
                            {task.status.replace('_', ' ')}
                        </span>
                        <PriorityBadge priority={task.priority} className="!px-2.5 !py-1 !text-[10px]" />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    {/* Due Date */}
                    {task.due_date && (
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[12px] font-bold ${dueStatus ? dueStyles[dueStatus] : 'text-slate-500 dark:text-slate-400 border-transparent'}`}>
                            <Calendar size={14} />
                            {dueStatus === 'overdue' ? 'Overdue' : dueStatus === 'due_today' ? 'Due Today' : dueStatus === 'due_soon' ? 'Due Soon' : new Date(task.due_date).toLocaleDateString()}
                        </div>
                    )}

                    {/* Progress Bar (if subtasks exist) */}
                    {subtasks.length > 0 && (
                        <div className="flex items-center gap-3 min-w-[120px]">
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">{completedCount}/{subtasks.length}</span>
                        </div>
                    )}

                    {/* Comments Count */}
                    {commentCount > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[12px] font-bold">
                            <MessageSquare size={14} />
                            {commentCount}
                        </div>
                    )}

                    {/* Assignee */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800/60">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                            {(task.assignee?.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                            {task.assignee?.full_name || task.assignee?.email?.split('@')[0] || 'Unassigned'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Action: Chevron */}
            <div className="hidden md:flex items-center justify-center text-slate-300 dark:text-slate-700 group-hover:text-blue-500 transition-colors">
                <ChevronRight size={20} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
};

export default TaskListCard;
