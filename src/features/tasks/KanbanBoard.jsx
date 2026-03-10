import React, { useMemo } from 'react';
import KanbanColumn from './KanbanColumn';
import { sortTasksByPriority } from '../../utils/sortTasks';

const STATUSES = ['pending', 'in_progress', 'completed'];

const KanbanBoard = ({ tasks, onStatusChange, role, onTaskClick }) => {
    // Group tasks by status and sort within each group
    const groupedTasks = useMemo(() => {
        const groups = {
            pending: [],
            in_progress: [],
            completed: [],
        };

        tasks.forEach(task => {
            const status = task.status || 'pending';
            if (groups[status]) {
                groups[status].push(task);
            } else {
                groups.pending.push(task);
            }
        });

        // Sort each group by priority
        Object.keys(groups).forEach(key => {
            groups[key] = sortTasksByPriority(groups[key]);
        });

        return groups;
    }, [tasks]);

    const handleDrop = (taskId, currentStatus, newStatus) => {
        onStatusChange(taskId, currentStatus, newStatus);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map(status => (
                <KanbanColumn
                    key={status}
                    status={status}
                    tasks={groupedTasks[status]}
                    role={role}
                    onDrop={handleDrop}
                    onTaskClick={onTaskClick}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;
