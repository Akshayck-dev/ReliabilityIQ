/**
 * Priority-based sort utility for tasks.
 * Sorts: High → Medium → Low, then by due_date ascending (soonest first).
 */

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export const sortTasksByPriority = (tasks) => {
    return [...tasks].sort((a, b) => {
        const pA = PRIORITY_ORDER[(a.priority || 'medium').toLowerCase()] ?? 1;
        const pB = PRIORITY_ORDER[(b.priority || 'medium').toLowerCase()] ?? 1;

        if (pA !== pB) return pA - pB;

        // Secondary sort: due_date ascending (tasks with no deadline go last)
        const dA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return dA - dB;
    });
};

export default sortTasksByPriority;
