import React from 'react';
import { format, isPast, isToday, isTomorrow, differenceInDays, startOfDay } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpcomingDeadlines = ({ tasks }) => {
    // Filter out completed tasks and tasks with invalid/missing deadlines
    const pendingWithDeadlines = tasks.filter(t =>
        t.status !== 'completed' &&
        t.due_date &&
        !isNaN(new Date(t.due_date).getTime())
    );

    // Sort by closest deadline first
    const sortedTasks = pendingWithDeadlines.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    // Take top 5
    const upcomingTasks = sortedTasks.slice(0, 5);

    if (upcomingTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <CheckCircle2 size={24} className="text-emerald-500" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">No approaching deadlines</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">You're all caught up on scheduled tasks.</p>
            </div>
        );
    }

    const getDeadlineInfo = (dateString) => {
        const due = startOfDay(new Date(dateString));
        const today = startOfDay(new Date());

        if (isPast(due) && !isToday(due)) {
            const days = differenceInDays(today, due);
            return {
                isOverdue: true,
                label: `${days} day${days > 1 ? 's' : ''} overdue`,
                color: 'text-red-700 bg-red-100 border-red-200 animate-pulse ring-1 ring-red-500/30',
                icon: <AlertCircle size={14} className="text-red-600 shrink-0" />
            };
        }
        if (isToday(due)) {
            return {
                label: 'Due Today',
                color: 'text-orange-600 bg-orange-50 border-orange-100',
                icon: <Clock size={14} className="text-orange-500 shrink-0" />
            };
        }
        if (isTomorrow(due)) {
            return {
                label: 'Due Tomorrow',
                color: 'text-amber-600 bg-amber-50 border-amber-100',
                icon: <Clock size={14} className="text-amber-500 shrink-0" />
            };
        }

        const days = differenceInDays(due, today);
        return {
            label: `In ${days} days`,
            color: 'text-slate-600 bg-slate-50 border-slate-200',
            icon: <Clock size={14} className="text-slate-400 shrink-0" />
        };
    };

    return (
        <div className="flex flex-col divide-y divide-slate-100">
            {upcomingTasks.map(task => {
                const info = getDeadlineInfo(task.due_date);
                return (
                    <div key={task.id} className={`py-4 px-3 sm:px-0 sm:py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group transition-all duration-200 ${info.isOverdue ? 'border-l-[3px] border-l-red-500 bg-red-50/40 rounded-r-md -ml-3 pl-3' : ''}`}>
                        <div className="min-w-0">
                            <Link
                                to={`/tasks/${task.id}`}
                                className="text-sm font-semibold text-slate-900 truncate block hover:text-[#ea580c] transition-colors"
                            >
                                {task.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${info.color}`}>
                                    {info.icon}
                                    {info.label}
                                </span>
                                <span className="text-[11px] text-slate-400 font-medium">
                                    {format(new Date(task.due_date), 'MMM d')}
                                </span>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-600">
                                {task.priority || 'Medium'}
                            </span>
                        </div>
                    </div>
                );
            })}

            {pendingWithDeadlines.length > 5 && (
                <div className="pt-4 mt-2 text-center">
                    <Link to="/tasks" className="text-xs font-semibold text-[#ea580c] hover:text-orange-700 hover:underline">
                        View all {pendingWithDeadlines.length} pending tasks
                    </Link>
                </div>
            )}
        </div>
    );
};

export default UpcomingDeadlines;
