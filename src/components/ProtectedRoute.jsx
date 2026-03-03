import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { user, role, loading } = useAuth();

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        // If not authenticated, redirect to login
        return <Navigate to="/login" replace />;
    }

    if (role === 'pending_signup') {
        // If they have a session but haven't chosen a role, force them to onboarding
        return <Navigate to="/complete-signup" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // If authenticated but missing required role, redirect to unauthorized/dashboard
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
