import React, { useMemo, useState } from 'react';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import KanbanTaskCard from './KanbanTaskCard';
import { sortTasksByPriority } from '../../utils/sortTasks';

const STATUSES = ['pending', 'in_progress', 'completed'];

const KanbanBoard = ({ tasks, onStatusChange, role }) => {
    const [activeTask, setActiveTask] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

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

    const handleDragStart = (event) => {
        const { active } = event;
        const draggedTask = tasks.find(t => t.id === active.id);
        setActiveTask(draggedTask || null);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id;
        const newStatus = over.id;

        // Only process if dropped on a valid column
        if (!STATUSES.includes(newStatus)) return;

        // Find the task's current status
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return;

        onStatusChange(taskId, task.status, newStatus);
    };

    const handleDragCancel = () => {
        setActiveTask(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STATUSES.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        tasks={groupedTasks[status]}
                        role={role}
                    />
                ))}
            </div>

            {/* Drag Overlay — renders a floating card while dragging */}
            <DragOverlay dropAnimation={null}>
                {activeTask ? (
                    <div className="rotate-3 scale-105">
                        <KanbanTaskCard task={activeTask} role={role} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
