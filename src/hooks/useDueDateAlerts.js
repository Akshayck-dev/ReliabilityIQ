import { useEffect, useRef, useCallback, useMemo } from 'react';
import { getDueCounts } from '../utils/dueDateUtils';
import { taskService } from '../services/taskService';

/**
 * Custom hook for automatic due date alerts.
 * - Returns { overdue, dueToday, dueSoon } counts
 * - Auto-inserts notifications for overdue/due-today tasks (with duplicate prevention)
 * - Auto-refreshes tasks every 60 seconds via the provided refetch callback
 *
 * @param {Array} tasks - Current task list
 * @param {string} userId - Current user ID
 * @param {Function} refetch - Callback to re-fetch tasks from the API
 * @returns {{ overdue: number, dueToday: number, dueSoon: number }}
 */
const useDueDateAlerts = (tasks, userId, refetch) => {
    const alertsProcessedRef = useRef(new Set());

    // Calculate due counts from current tasks
    const dueCounts = useMemo(() => getDueCounts(tasks || []), [tasks]);

    // Insert notifications for overdue / due-today tasks
    const processAlerts = useCallback(async () => {
        if (!tasks?.length || !userId) return;

        // Create a fingerprint for the current task set to avoid re-processing identical data
        const fingerprint = tasks.map(t => `${t.id}-${t.status}`).join(',');
        if (alertsProcessedRef.current.has(fingerprint)) return;
        alertsProcessedRef.current.add(fingerprint);

        // Keep the set manageable
        if (alertsProcessedRef.current.size > 50) {
            const entries = [...alertsProcessedRef.current];
            alertsProcessedRef.current = new Set(entries.slice(-10));
        }

        await taskService.checkAndInsertDueAlerts(tasks, userId);
    }, [tasks, userId]);

    // Process alerts when tasks change
    useEffect(() => {
        processAlerts();
    }, [processAlerts]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        if (!refetch) return;

        const intervalId = setInterval(() => {
            refetch();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [refetch]);

    return dueCounts;
};

export default useDueDateAlerts;
