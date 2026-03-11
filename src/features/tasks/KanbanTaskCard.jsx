import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, GripVertical } from 'lucide-react';
import PriorityBadge from '../../components/ui/PriorityBadge';

const KanbanTaskCard = ({ task, role, onDragStart, onTaskClick }) => {
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
            className="group bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 cursor-grab active:cursor-grabbing"
        >
            {/* Drag Handle + Title Row */}
            <div className="flex items-start gap-2">
                <div className="mt-0.5 p-1 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0">
                    <GripVertical size={14} />
                </div>

                <button
                    onClick={() => {
                        if (onTaskClick) onTaskClick(task.id);
                    }}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 text-left block flex-1 focus:outline-none"
                    draggable={false}
                >
                    {task.title}
                </button>
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-7 line-clamp-2 leading-relaxed">
                    {task.description}
                </p>
            )}

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-2 mt-3 ml-7">
                <PriorityBadge priority={task.priority || 'medium'} />

                {task.due_date && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                        <Clock size={10} className="text-amber-500" />
                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                )}
            </div>

            {/* Assignee (Manager View) */}
            {role === 'manager' && task.assignee && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 ml-7 border-t border-slate-100 dark:border-slate-700">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-white font-bold" style={{fontSize: '9px'}}>
                            {(task.assignee?.full_name || task.assignee?.email || 'U')[0].toUpperCase()}
                        </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {task.assignee?.full_name || task.assignee?.email?.split('@')[0] || 'Unassigned'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default KanbanTaskCard;
