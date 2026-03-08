import { supabase } from '../lib/supabase';

/**
 * Task Management Service
 * Abstraction layer for all Supabase database operations related to tasks.
 */

// Format:
// tasks table -> id, title, description, status (pending, in_progress, completed), assigned_to, created_by, created_at, due_date, completed_at

export const taskService = {

    /**
     * Helper to append a system activity log into the remarks array
     */
    _logSystemActivity: async (taskId, actionText, userEmail) => {
        try {
            const { data: task } = await supabase.from('tasks').select('remarks').eq('id', taskId).single();
            const currentRemarks = task?.remarks || [];

            const systemLog = {
                id: Date.now().toString() + Math.random().toString(36).substring(7),
                text: actionText,
                author_email: userEmail || 'System',
                type: 'system',
                created_at: new Date().toISOString()
            };

            const newRemarks = [...currentRemarks, systemLog];
            await supabase.from('tasks').update({ remarks: newRemarks }).eq('id', taskId);
        } catch (e) {
            console.error("Failed to log system activity:", e);
        }
    },

    /**
     * Helper to log notifications internally
     */
    _logNotification: async (userId, taskId, title, message, type) => {
        try {
            const { error } = await supabase.from('notifications').insert([{
                user_id: userId,
                task_id: taskId,
                title,
                message,
                type
            }]);
            if (error) {
                console.error("Supabase insert notification error:", error);
            }
        } catch (e) {
            console.error("Failed to insert notification exception:", e);
        }
    },

    /**
     * Simulate AI Description Improvement
     * In a real app, this would hit an OpenAI or Gemini backend endpoint.
     */
    improveTaskDescription: async (title, originalDescription) => {
        // Mock a network delay of 1.5 seconds to simulate AI generation
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Basic NLP-like restructuring simulation
        let improved = originalDescription.trim();

        if (improved.length < 20) {
            improved = `Detailed breakdown for: ${title}\n\nObjective: ${improved}\n\nPlease ensure all system checks pass and log any anomalies encountered during execution.`;
        } else {
            improved = `## Task Overview\n${improved}\n\n## Action Items\n- Review current status\n- Execute required changes\n- Update documentation\n\n## Expected Outcome\nSuccessful resolution of the task with zero regression.`;
        }

        return improved;
    },

    /**
     * For Managers: Create a new task and optionally assign it immediately
     */
    createTask: async (taskData) => {
        const managerEmail = taskData.manager_email;
        delete taskData.manager_email; // Prevents schema errors

        // Allow parent_task_id to pass through to DB

        const initialLog = {
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            text: 'Task created in system',
            author_email: managerEmail || 'Manager',
            type: 'system',
            created_at: new Date().toISOString()
        };

        // Inject initial log so it exists without needing a second DB roundtrip
        taskData.remarks = [initialLog];

        const { data, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Notify if immediately assigned
        if (data.assigned_to) {
            await taskService._logNotification(data.assigned_to, data.id, 'New Task Assigned', `You have been assigned to task: ${data.title}`, 'assigned');
        }

        return data;
    },

    /**
     * For Managers: Fetch only tasks created by this manager
     */
    getAllTasks: async (managerId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('manager_id', managerId)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * For Employees: Fetch only tasks assigned to them
     */
    getAssignedTasks: async (employeeId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('assigned_to', employeeId)
            .eq('is_archived', false)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * For Managers: Reassign an existing task to a new employee
     */
    assignTask: async (taskId, employeeId, assignerEmail = 'Manager') => {
        const { data, error } = await supabase
            .from('tasks')
            .update({ assigned_to: employeeId })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await taskService._logSystemActivity(taskId, 'Task reassigned to new employee', assignerEmail);
        await taskService._logNotification(employeeId, taskId, 'Task Reassigned', `You have been assigned to a task by ${assignerEmail}`, 'assigned');
        return data;
    },

    /**
     * For Employees/Managers: Update the status of a task (e.g. pending -> in_progress)
     */
    updateTaskStatus: async (taskId, newStatus, userEmail = 'System') => {
        const { data, error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        const statusMap = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed'
        };
        await taskService._logSystemActivity(taskId, `Task moved to '${statusMap[newStatus] || newStatus}'`, userEmail);

        // Notify manager (only if the user making the change is not the manager themselves)
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;

        if (data.manager_id && data.manager_id !== currentUserId) {
            await taskService._logNotification(data.manager_id, taskId, 'Task Status Updated', `Task '${data.title}' status changed to ${statusMap[newStatus]} by ${userEmail}`, 'status_update');
        }

        return data;
    },

    /**
     * For Employees/Managers: Mark a task as complete specifically
     */
    markTaskComplete: async (taskId, userEmail = 'System') => {
        const { data, error } = await supabase
            .from('tasks')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        await taskService._logSystemActivity(taskId, `Task marked as Completed`, userEmail);

        // Notify manager (only if the user making the change is not the manager themselves)
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;

        if (data.manager_id && data.manager_id !== currentUserId) {
            await taskService._logNotification(data.manager_id, taskId, 'Task Completed', `Task '${data.title}' was marked as completed by ${userEmail}`, 'status_update');
        }

        return data;
    },

    /**
     * Utility: Fetch all employee users for the assignment dropdown
     */
    getAvailableEmployees: async () => {
        const { data, error } = await supabase
            .from('users') // We set up this table in the Auth Context!
            .select('id, email, role')
            .eq('role', 'employee');

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * For Managers: Fetch employees assigned to this manager (My Team)
     */
    getMyTeam: async (managerId) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, manager_id')
            .eq('role', 'employee')
            .eq('manager_id', managerId);

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * For Managers: Fetch employees that have no manager assigned yet
     */
    getUnassignedEmployees: async () => {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, manager_id')
            .eq('role', 'employee')
            .is('manager_id', null);

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * For Managers: Assign an unassigned employee to the current manager via secure RPC
     */
    assignEmployeeToManager: async (employeeId) => {
        const { error } = await supabase.rpc('assign_employee_to_manager', {
            employee_id: employeeId
        });

        if (error) throw new Error(error.message);
    },

    /**
     * Global Search: Search employees under this manager
     */
    searchEmployees: async (managerId, term) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role')
            .eq('role', 'employee')
            .eq('manager_id', managerId)
            .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
            .limit(5);

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Global Search: Search tasks by title
     * For managers: tasks where manager_id = userId
     * For employees: tasks where assigned_to = userId
     */
    searchTasks: async (userId, role, term) => {
        let query = supabase
            .from('tasks')
            .select('id, title, status, assigned_to')
            .ilike('title', `%${term}%`)
            .limit(5);

        if (role === 'manager') {
            query = query.eq('manager_id', userId);
        } else {
            query = query.eq('assigned_to', userId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Fetch a single task by ID
     */
    getTaskById: async (taskId) => {
        const { data: rawTask, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', taskId)
            .single();

        if (error) throw new Error(error.message);

        // Manually fetch joined data to avoid strict Postgres Foreign Key setup requirements
        let assignee = null;
        if (rawTask.assigned_to) {
            const { data } = await supabase.from('users').select('email, role').eq('id', rawTask.assigned_to).single();
            if (data) assignee = data;
        }

        let creator = null;
        if (rawTask.manager_id) {
            const { data } = await supabase.from('users').select('email, role').eq('id', rawTask.manager_id).single();
            if (data) creator = data;
        }

        return {
            ...rawTask,
            assignee,
            creator
        };
    },

    /**
     * Fetch linked tasks (parent and children) for a given taskId
     */
    getLinkedTasks: async (taskId) => {
        // 1. Get the current task to check if it HAS a parent
        const { data: currentTask, error: currentErr } = await supabase
            .from('tasks')
            .select('parent_task_id')
            .eq('id', taskId)
            .single();

        if (currentErr) throw new Error(currentErr.message);

        const parentId = currentTask?.parent_task_id;

        let parentTask = null;
        if (parentId) {
            const { data: pTask } = await supabase
                .from('tasks')
                .select('id, title, status')
                .eq('id', parentId)
                .single();
            parentTask = pTask;
        }

        // 2. Get children (tasks where parent_task_id is THIS taskId)
        const { data: childTasks, error: childErr } = await supabase
            .from('tasks')
            .select('id, title, status')
            .eq('parent_task_id', taskId)
            .order('created_at', { ascending: false });

        if (childErr) throw new Error(childErr.message);

        return {
            parentTask,
            childTasks: childTasks || []
        };
    },

    /**
     * For Managers: Archive a task (soft delete)
     */
    archiveTask: async (taskId) => {
        const { data, error } = await supabase
            .from('tasks')
            .update({ is_archived: true })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * For Managers: Restore an archived task
     */
    restoreTask: async (taskId) => {
        const { data, error } = await supabase
            .from('tasks')
            .update({ is_archived: false })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * For Managers: Fetch archived tasks
     */
    getArchivedTasks: async (managerId) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('manager_id', managerId)
            .eq('is_archived', true)
            .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * For Shared App: Add a remark to a specific task
     */
    addRemarkToTask: async (taskId, remarkObj) => {
        // 1. Fetch current remarks array
        const { data: task, error: fetchErr } = await supabase
            .from('tasks')
            .select('remarks')
            .eq('id', taskId)
            .single();

        if (fetchErr) throw new Error(fetchErr.message);

        const currentRemarks = task.remarks || [];
        const newRemarks = [...currentRemarks, remarkObj];

        // 2. Update with the appended array
        const { data, error } = await supabase
            .from('tasks')
            .update({ remarks: newRemarks })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Notify relevant parties
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUserId = sessionData?.session?.user?.id;

        if (data.manager_id && data.manager_id !== currentUserId) {
            await taskService._logNotification(data.manager_id, taskId, 'New Remark', `New remark added on task '${data.title}'`, 'remark');
        }
        if (data.assigned_to && data.assigned_to !== currentUserId) {
            await taskService._logNotification(data.assigned_to, taskId, 'New Remark', `New remark added on task '${data.title}'`, 'remark');
        }

        return data;
    },

    /**
     * For Shared App: Delete a remark from a specific task
     */
    deleteRemarkFromTask: async (taskId, remarkId) => {
        // 1. Fetch current remarks array
        const { data: task, error: fetchErr } = await supabase
            .from('tasks')
            .select('remarks')
            .eq('id', taskId)
            .single();

        if (fetchErr) throw new Error(fetchErr.message);

        const currentRemarks = task.remarks || [];
        const newRemarks = currentRemarks.filter(r => r.id !== remarkId);

        // 2. Update with the filtered array
        const { data, error } = await supabase
            .from('tasks')
            .update({ remarks: newRemarks })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw new Error(error.message);

        return data;
    },

    /**
     * Fetch user notifications
     */
    getNotifications: async (userId) => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw new Error(error.message);
        return data || [];
    },

    /**
     * Mark a notification as read
     */
    markNotificationRead: async (notificationId) => {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    },

    /**
     * Analytics: Get Reliability Data for Employees under a specific manager.
     * Attempts Postgres View first. If that fails/doesn't exist, calculates manually in JS.
     */
    getEmployeeReliabilityStats: async (managerId) => {
        // First, get the list of employees under this manager
        let teamIds = [];
        if (managerId) {
            const { data: teamData } = await supabase
                .from('users')
                .select('id')
                .eq('role', 'employee')
                .eq('manager_id', managerId);
            teamIds = (teamData || []).map(u => u.id);
        }

        try {
            // Attempt #1: Query the Performance View directly from Postgres
            const { data, error } = await supabase
                .from('employee_reliability_stats')
                .select('*');

            if (!error && data) {
                // Transform and filter to only manager's team
                const formattedData = data
                    .filter(employee => !managerId || teamIds.includes(employee.employee_id))
                    .map(employee => ({
                        id: employee.employee_id,
                        name: employee.employee_name || (employee.employee_email ? employee.employee_email.split('@')[0] : 'Unknown Employee'),
                        email: employee.employee_email || 'No Email',
                        reliability: employee.reliability_score || 0,
                        completed: employee.completed_tasks || 0,
                        pending: employee.pending_tasks || 0,
                        totalAssigned: employee.total_assigned_tasks || 0,
                        onTime: employee.on_time_completions || 0,
                        late: employee.completed_tasks - employee.on_time_completions || 0
                    }));
                return formattedData.sort((a, b) => b.reliability - a.reliability);
            }
        } catch (err) {
            console.warn("Postgres View 'employee_reliability_stats' unavailable, falling back to JS aggregation.", err);
        }

        // Attempt #2: Manual JS Aggregation Fallback
        let userQuery = supabase.from('users').select('id, email').eq('role', 'employee');
        if (managerId) {
            userQuery = userQuery.eq('manager_id', managerId);
        }
        const { data: users, error: usersErr } = await userQuery;
        if (usersErr) throw new Error(usersErr.message);

        let taskQuery = supabase.from('tasks').select('*');
        if (managerId) {
            taskQuery = taskQuery.eq('manager_id', managerId);
        }
        const { data: tasks, error: tasksErr } = await taskQuery;
        if (tasksErr) throw new Error(tasksErr.message);

        const formattedData = users.map(user => {
            const userTasks = tasks.filter(t => t.assigned_to === user.id);
            const totalAssigned = userTasks.length;
            const completedTasks = userTasks.filter(t => t.status === 'completed');
            const pendingTasks = userTasks.filter(t => t.status !== 'completed');

            let onTimeCount = 0;
            completedTasks.forEach(t => {
                if (!t.due_date) {
                    onTimeCount++; // If no deadline, it's technically never late
                    return;
                }
                const completedAt = new Date(t.completed_at || t.updated_at || t.created_at);
                const due = new Date(t.due_date);
                if (!isNaN(completedAt.getTime()) && !isNaN(due.getTime())) {
                    // Start of day matching for safety
                    const cDay = new Date(completedAt.getFullYear(), completedAt.getMonth(), completedAt.getDate());
                    const dDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                    if (cDay.getTime() <= dDay.getTime()) {
                        onTimeCount++;
                    }
                }
            });

            const reliability = completedTasks.length > 0
                ? Math.round((onTimeCount / completedTasks.length) * 100)
                : 0;

            return {
                id: user.id,
                name: user.email.split('@')[0],
                email: user.email,
                reliability: reliability,
                completed: completedTasks.length,
                pending: pendingTasks.length,
                totalAssigned: totalAssigned,
                onTime: onTimeCount,
                late: completedTasks.length - onTimeCount
            };
        });

        return formattedData.sort((a, b) => b.reliability - a.reliability);
    },

    /**
     * Automatically check tasks for due date alerts and insert notifications.
     * Prevents duplicates by checking if a notification with the same task_id + type
     * was already created today.
     */
    checkAndInsertDueAlerts: async (tasks, userId) => {
        if (!tasks?.length || !userId) return;

        const { getDueStatus } = await import('../utils/dueDateUtils');
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        for (const task of tasks) {
            const status = getDueStatus(task);
            if (status !== 'overdue' && status !== 'due_today') continue;

            const notifType = status === 'overdue' ? 'overdue' : 'due_today';
            const notifTitle = status === 'overdue' ? 'Task Overdue' : 'Task Due Today';
            const notifMessage = status === 'overdue'
                ? `Task '${task.title}' is past its due date and needs attention.`
                : `Task '${task.title}' is due today.`;

            // Determine recipient: notify both assignee and manager
            const recipients = new Set();
            if (task.assigned_to) recipients.add(task.assigned_to);
            if (task.manager_id) recipients.add(task.manager_id);

            for (const recipientId of recipients) {
                try {
                    // Check for existing notification today with same task + type
                    const { data: existing } = await supabase
                        .from('notifications')
                        .select('id')
                        .eq('task_id', task.id)
                        .eq('user_id', recipientId)
                        .eq('type', notifType)
                        .gte('created_at', todayStart.toISOString())
                        .limit(1);

                    if (existing && existing.length > 0) continue;

                    await taskService._logNotification(
                        recipientId,
                        task.id,
                        notifTitle,
                        notifMessage,
                        notifType
                    );
                } catch (e) {
                    // Silently skip — don't interrupt the loop
                }
            }
        }
    }
};
