import React, { useMemo } from 'react';
import KanbanColumn from './KanbanColumn';
import { sortTasksByPriority } from '../../utils/sortTasks';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const STATUSES = ['pending', 'in_progress', 'review', 'completed'];

const KanbanBoard = ({ tasks, dataStatus, onStatusChange, role, onTaskClick }) => {
    const { playSuccess, playPop } = useSoundEffects();

    // Group tasks by status and sort within each group
    const groupedTasks = useMemo(() => {
        const groups = {
            pending: [],
            in_progress: [],
            review: [],
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
        
        // Play sounds on successful drop
        if (newStatus === 'completed') {
            playSuccess();
        } else {
            playPop();
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUSES.map(colStatus => (
                <KanbanColumn
                    key={colStatus}
                    status={colStatus}
                    loading={dataStatus === 'loading' && tasks.length === 0}
                    tasks={groupedTasks[colStatus]}
                    role={role}
                    onDrop={handleDrop}
                    onTaskClick={onTaskClick}
                />
            ))}
        </div>
    );
};

export default KanbanBoard;
