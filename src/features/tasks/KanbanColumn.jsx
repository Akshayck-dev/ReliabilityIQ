import React, { useState } from 'react';
import KanbanTaskCard from './KanbanTaskCard';
import { TaskCardSkeleton } from '../../components/ui/Skeleton';
import { Inbox } from 'lucide-react';

const COLUMN_CONFIG = {
    pending: {
        label: 'To Do',
        topBorder: 'bg-slate-400',
        headerBg: 'bg-slate-50 dark:bg-slate-800/60',
        badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
        emptyText: 'No pending tasks',
    },
    in_progress: {
        label: 'In Progress',
        topBorder: 'bg-blue-500',
        headerBg: 'bg-blue-50/60 dark:bg-blue-900/10',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        emptyText: 'No tasks in progress',
    },
    review: {
        label: 'In Review',
        topBorder: 'bg-violet-500',
        headerBg: 'bg-violet-50/60 dark:bg-violet-900/10',
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
        emptyText: 'No tasks in review',
    },
    completed: {
        label: 'Completed',
        topBorder: 'bg-green-500',
        headerBg: 'bg-green-50/60 dark:bg-green-900/10',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        emptyText: 'No completed tasks',
    },
};

const KanbanColumn = ({ status, tasks, loading, role, onDrop, onTaskClick }) => {
    const config = COLUMN_CONFIG[status];
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsOver(true);
    };

    const handleDragLeave = (e) => {
        // Only set isOver to false if we're leaving the drop zone entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsOver(false);

        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            const { taskId, currentStatus } = data;

            if (currentStatus !== status) {
                onDrop(taskId, currentStatus, status);
            }
        } catch (err) {
            // Invalid drop data, ignore
        }
    };

    return (
        <div className="flex flex-col min-w-[300px] flex-1">
            {/* Column Header — colored top border accent */}
            <div className={`rounded-t-xl overflow-hidden`}>
                <div className={`h-1 w-full ${config.topBorder}`} />
                <div className={`flex items-center gap-2.5 px-4 py-3 ${config.headerBg}`}>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight flex-1">
                        {config.label}
                    </h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${config.badge}`}>
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 flex flex-col gap-3 p-3 rounded-b-xl border-2 border-dashed transition-all duration-200 min-h-[200px] ${isOver
                    ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                    }`}
            >
                {loading ? (
                    <>
                        <TaskCardSkeleton />
                        <TaskCardSkeleton />
                    </>
                ) : tasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                        <Inbox size={28} className="mb-2 opacity-40" />
                        <p className="text-xs font-medium">{config.emptyText}</p>
                        <p className="text-[10px] mt-0.5 opacity-60">Drop tasks here</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <KanbanTaskCard key={task.id} task={task} role={role} onTaskClick={onTaskClick} />
                    ))
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
