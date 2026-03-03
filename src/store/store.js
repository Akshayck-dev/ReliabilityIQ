import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../features/tasks/tasksSlice';
import notificationsReducer from '../features/notifications/notificationsSlice';
import themeReducer from './themeSlice';

export const store = configureStore({
    reducer: {
        tasks: tasksReducer,
        notifications: notificationsReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false // Often useful with Supabase sessions
    }),
});
