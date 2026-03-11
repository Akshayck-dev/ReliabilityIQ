import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskService } from '../../services/taskService';
import toast from 'react-hot-toast';

// --- Thunks ---

export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async ({ role, userId }, { rejectWithValue }) => {
        try {
            if (role === 'manager') {
                return await taskService.getAllTasks(userId);
            } else {
                return await taskService.getAssignedTasks(userId);
            }
        } catch (error) {
            toast.error("Failed to load tasks.");
            return rejectWithValue(error.message);
        }
    }
);

export const createTask = createAsyncThunk(
    'tasks/createTask',
    async (taskData, { rejectWithValue }) => {
        try {
            const data = await taskService.createTask(taskData);
            toast.success("Task created successfully!");
            return data;
        } catch (error) {
            toast.error("Failed to create task.");
            return rejectWithValue(error.message);
        }
    }
);

export const assignTask = createAsyncThunk(
    'tasks/assignTask',
    async ({ taskId, employeeId, userEmail }, { rejectWithValue }) => {
        try {
            const data = await taskService.assignTask(taskId, employeeId, userEmail);
            toast.success("Task reassigned successfully.");
            return data;
        } catch (error) {
            toast.error("Failed to reassign task.");
            return rejectWithValue(error.message);
        }
    }
);

export const updateTaskStatus = createAsyncThunk(
    'tasks/updateTaskStatus',
    async ({ taskId, currentStatus, newStatus, userEmail }, { rejectWithValue }) => {
        try {
            return await taskService.updateTaskStatus(taskId, newStatus, userEmail);
        } catch (error) {
            toast.error("Failed to update status. Rollback applied.");
            // Pass the original status back so the reducer can rollback
            return rejectWithValue({ taskId, originalStatus: currentStatus, error: error.message });
        }
    }
);

// --- Slice ---
const tasksSlice = createSlice({
    name: 'tasks',
    initialState: {
        items: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
    },
    reducers: {
        taskAdded: (state, action) => {
            // Prevent duplicates if thunk already added it
            const exists = state.items.find(t => t.id === action.payload.id);
            if (!exists) {
                state.items.unshift(action.payload);
            }
        },
        taskUpdated: (state, action) => {
            const index = state.items.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
                state.items[index] = { ...state.items[index], ...action.payload };
            }
        },
        taskDeleted: (state, action) => {
            state.items = state.items.filter(t => t.id !== action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Tasks
            .addCase(fetchTasks.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTasks.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchTasks.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // Create Task
            .addCase(createTask.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })

            // Assign Task
            .addCase(assignTask.fulfilled, (state, action) => {
                const index = state.items.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...action.payload };
                }
            })

            // Update Status
            .addCase(updateTaskStatus.pending, (state, action) => {
                // Optimistic visual update
                const { taskId, newStatus } = action.meta.arg;
                const index = state.items.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    state.items[index].status = newStatus;
                }
            })
            .addCase(updateTaskStatus.fulfilled, (state, action) => {
                // DB Confirmation
                const index = state.items.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = { ...state.items[index], ...action.payload };
                }
            })
            .addCase(updateTaskStatus.rejected, (state, action) => {
                // Rollback optimistic update
                const { taskId, originalStatus } = action.payload;
                const index = state.items.findIndex(t => t.id === taskId);
                if (index !== -1) {
                    state.items[index].status = originalStatus;
                }
            });
    },
});

export const { taskAdded, taskUpdated, taskDeleted } = tasksSlice.actions;

export default tasksSlice.reducer;
