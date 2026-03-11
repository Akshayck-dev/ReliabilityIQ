import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../lib/supabase';
import { taskAdded, taskUpdated, taskDeleted } from '../features/tasks/tasksSlice';
import { useAuth } from '../features/auth/AuthContext';

export const useTaskRealtime = () => {
    const dispatch = useDispatch();
    const { user, role } = useAuth();

    useEffect(() => {
        if (!user) return;

        // Subscribe to changes on the tasks table
        const channel = supabase
            .channel('public:tasks')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'tasks' },
                (payload) => {
                    // Check if the task belongs to the current user's scope
                    const task = payload.new;
                    if (role === 'manager' && task.manager_id === user.id) {
                        dispatch(taskAdded(task));
                    } else if (role === 'employee' && task.assigned_to === user.id) {
                        dispatch(taskAdded(task));
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'tasks' },
                (payload) => {
                    const task = payload.new;
                    // For updates, checking scope is good, but usually if it exists in Redux, we just update it
                    // The slice reducer will safely ignore it if the task isn't in the list
                    dispatch(taskUpdated(task));
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'tasks' },
                (payload) => {
                    dispatch(taskDeleted(payload.old.id));
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("Connected to Supabase Realtime for tasks!");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dispatch, user, role]);
};
