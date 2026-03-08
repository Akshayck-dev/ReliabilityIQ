import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { Clock, User, GripVertical } from 'lucide-react';
import PriorityBadge from '../../components/ui/PriorityBadge';

const KanbanTaskCard = ({ task, role }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        cursor: 'default',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 ${isDragging ? 'shadow-xl ring-2 ring-orange-400/40 scale-[1.02] z-50' : ''}`}
        >
            {/* Drag Handle + Title Row */}
            <div className="flex items-start gap-2">
                <button
                    {...listeners}
                    {...attributes}
                    className="mt-0.5 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0 touch-none"
                    aria-label="Drag to reorder"
                >
                    <GripVertical size={14} />
                </button>

                <Link
                    to={`/tasks/${task.id}`}
                    className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-[#ea580c] dark:hover:text-orange-400 transition-colors line-clamp-2 block flex-1"
                >
                    {task.title}
                </Link>
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
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <User size={10} className="text-white" />
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
