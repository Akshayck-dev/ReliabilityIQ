import { startOfDay, isPast, isToday, differenceInDays } from 'date-fns';

/**
 * Classify a task's due status based on its due_date and completion status.
 * @param {Object} task - Task object with due_date and status fields
 * @returns {'overdue'|'due_today'|'due_soon'|null}
 */
export const getDueStatus = (task) => {
    if (!task.due_date || task.status === 'completed') return null;

    const due = startOfDay(new Date(task.due_date));
    const today = startOfDay(new Date());

    if (isNaN(due.getTime())) return null;

    // Overdue: due_date < today
    if (isPast(due) && !isToday(due)) return 'overdue';

    // Due Today
    if (isToday(due)) return 'due_today';

    // Due Soon: within 2 days (tomorrow or day after)
    const daysUntil = differenceInDays(due, today);
    if (daysUntil > 0 && daysUntil <= 2) return 'due_soon';

    return null;
};

/**
 * Count tasks by due status category.
 * @param {Array} tasks - Array of task objects
 * @returns {{ overdue: number, dueToday: number, dueSoon: number }}
 */
export const getDueCounts = (tasks) => {
    const counts = { overdue: 0, dueToday: 0, dueSoon: 0 };

    tasks.forEach(task => {
        const status = getDueStatus(task);
        if (status === 'overdue') counts.overdue++;
        else if (status === 'due_today') counts.dueToday++;
        else if (status === 'due_soon') counts.dueSoon++;
    });

    return counts;
};
