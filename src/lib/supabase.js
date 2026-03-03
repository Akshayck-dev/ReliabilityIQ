import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debounce flag to avoid multiple session-expired toasts
let sessionExpiredShown = false;

// Custom fetch wrapper that intercepts network failures and auth errors
const fetchWithErrorHandling = async (url, options = {}) => {
    try {
        const response = await fetch(url, options);

        // Session expired — 401 from Supabase API (not auth endpoints themselves)
        if (response.status === 401 && !url.includes('/auth/')) {
            if (!sessionExpiredShown) {
                sessionExpiredShown = true;
                toast.error('Session expired. Please login again.');
                // Sign out and redirect after a brief delay for the toast to show
                setTimeout(() => {
                    sessionExpiredShown = false;
                    window.location.href = '/login';
                }, 1500);
            }
            return response;
        }

        // Server error
        if (!response.ok && response.status >= 500) {
            toast.error('Server error. Please try again later.');
        }

        return response;
    } catch (error) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            toast.error('Network error. Please check your internet connection.');
        } else {
            toast.error('Connection failed. Please try again.');
        }
        throw error;
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
        fetch: fetchWithErrorHandling
    }
})