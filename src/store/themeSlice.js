import { createSlice } from '@reduxjs/toolkit';

// Read initial theme from localStorage safely
const getInitialTheme = () => {
    try {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark' ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

const initialState = {
    mode: getInitialTheme(),
};

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.mode = state.mode === 'light' ? 'dark' : 'light';
            try {
                localStorage.setItem('theme', state.mode);
            } catch {
                // Ignore storage errors safely
            }
        },
        setTheme: (state, action) => {
            // Action payload should be 'light' or 'dark'
            const newTheme = action.payload === 'dark' ? 'dark' : 'light';
            state.mode = newTheme;
            try {
                localStorage.setItem('theme', newTheme);
            } catch {
                // Ignore storage errors safely
            }
        },
    },
});

export const { toggleTheme, setTheme } = themeSlice.actions;

export default themeSlice.reducer;
