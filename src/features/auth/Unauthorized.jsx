import React from 'react';
import { useAuth } from '../auth/AuthContext';

const Unauthorized = () => {
    const { role } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md border border-red-100 text-center">
                <h2 className="text-3xl font-bold text-red-600">Access Denied</h2>
                <p className="text-gray-600 mt-4">
                    You do not have permission to view this page. Your current role is <span className="font-semibold">{role || 'Unknown'}</span>.
                </p>
            </div>
        </div>
    );
};

export default Unauthorized;
