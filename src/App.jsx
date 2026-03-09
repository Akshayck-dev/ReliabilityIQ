import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AuthProvider } from './features/auth/AuthContext';
import AppRoutes from './AppRoutes';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

function App() {
    const themeMode = useSelector((state) => state.theme.mode);

    useEffect(() => {
        if (themeMode === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.style.background = '#020617';
            document.body.style.background = '#020617';
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.background = '#ffffff';
            document.body.style.background = '#ffffff';
        }
    }, [themeMode]);

    return (
        <ErrorBoundary>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1e293b', // slate-800
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '14px',
                        },
                        success: {
                            iconTheme: {
                                primary: '#22c55e', // green-500
                                secondary: '#fff',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: '#ef4444', // red-500
                                secondary: '#fff',
                            },
                        },
                    }}
                />
                <AppRoutes />
                <Analytics />
            </AuthProvider>
        </ErrorBoundary>
    );
}

export default App;
