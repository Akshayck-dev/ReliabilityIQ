import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskService } from '../../services/taskService';

// Async thunks
export const fetchNotifications = createAsyncThunk(
    'notifications/fetchNotifications',
    async (userId) => {
        const data = await taskService.getNotifications(userId);
        return data;
    }
);

export const markNotificationRead = createAsyncThunk(
    'notifications/markRead',
    async (notificationId) => {
        await taskService.markNotificationRead(notificationId);
        return notificationId;
    }
);

export const markAllNotificationsRead = createAsyncThunk(
    'notifications/markAllRead',
    async (userId) => {
        await taskService.markAllNotificationsRead(userId);
        return true;
    }
);

const notificationsSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null
    },
    reducers: {
        // Reducer for realtime insertions
        notificationAdded(state, action) {
            // Unshift new notification at the top
            state.items.unshift(action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(markNotificationRead.fulfilled, (state, action) => {
                const existingNotification = state.items.find(n => n.id === action.payload);
                if (existingNotification) {
                    existingNotification.is_read = true;
                }
            })
            .addCase(markAllNotificationsRead.fulfilled, (state) => {
                state.items.forEach(n => {
                    n.is_read = true;
                });
            });
    }
});

export const { notificationAdded } = notificationsSlice.actions;

export default notificationsSlice.reducer;
