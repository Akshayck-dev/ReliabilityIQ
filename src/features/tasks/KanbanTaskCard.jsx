import React from 'react';
import { Clock, GripVertical, MessageSquare, AlertCircle, Calendar } from 'lucide-react';
import PriorityBadge from '../../components/ui/PriorityBadge';
import { getDueStatus } from '../../utils/dueDateUtils';

const KanbanTaskCard = ({ task, role, onTaskClick }) => {
    const dueStatus = getDueStatus(task);
    
    // Calculate subtask progress
    const subtaskRemark = (task.remarks || []).find(r => r.type === 'subtasks');
    const subtasks = subtaskRemark?.items || [];
    const completedCount = subtasks.filter(s => s.completed).length;
    const progressPercent = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;
    
    const commentCount = (task.remarks || []).filter(r => r.type !== 'system' && r.type !== 'subtasks').length;

    const dueStyles = {
        'overdue': 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20',
        'due_today': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
        'due_soon': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            taskId: task.id,
            currentStatus: task.status,
        }));
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.4';
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = '1';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className="group bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-900/30 cursor-grab active:cursor-grabbing relative overflow-hidden"
        >
            {/* Top Row: Priority & Drag Handle */}
            <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <GripVertical size={14} className="text-slate-300 dark:text-slate-700 shrink-0" />
                    <PriorityBadge priority={task.priority} className="!px-2 !py-0.5 !text-[9px]" />
                </div>
                
                {task.due_date && (
                    <div className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${dueStatus ? dueStyles[dueStatus] : 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800'}`}>
                        <Calendar size={10} />
                        {dueStatus === 'overdue' ? 'Overdue' : dueStatus === 'due_today' ? 'Today' : new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                )}
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 mb-4">
                <div className="flex items-start gap-1.5">
                    <button
                        onClick={() => onTaskClick && onTaskClick(task.id)}
                        className="text-[14px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-left line-clamp-2 leading-tight focus:outline-none"
                    >
                        {task.title}
                    </button>
                    {task.parent_status && task.parent_status !== 'completed' && (
                        <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                    )}
                </div>
                {task.description && (
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}
            </div>

            {/* Progress Bar */}
            {subtasks.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subtasks</span>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{completedCount}/{subtasks.length}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Footer: Assignee & Meta */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/60">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm shadow-blue-500/20">
                        {(task.assignee?.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">
                        {task.assignee?.full_name || task.assignee?.email?.split('@')[0] || 'Unassigned'}
                    </span>
                </div>

                {commentCount > 0 && (
                    <div className="flex items-center gap-1 text-slate-400 text-[11px] font-bold">
                        <MessageSquare size={12} />
                        {commentCount}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KanbanTaskCard;
