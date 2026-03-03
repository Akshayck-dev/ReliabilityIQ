import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Features / Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import CompleteSignup from './pages/auth/CompleteSignup';
import Unauthorized from './features/auth/Unauthorized';
import Dashboard from './features/dashboard/Dashboard';
import TasksDashboard from './features/tasks/TasksDashboard';
import TeamAnalytics from './features/analytics/TeamAnalytics';
import MyTasks from './pages/employee/MyTasks';
import AssignTask from './pages/manager/AssignTask';
import Employees from './pages/manager/Employees';
import Reports from './pages/manager/Reports';
import TaskDetails from './pages/shared/TaskDetails';
import Profile from './pages/shared/Profile';
import Settings from './pages/shared/Settings';
import NotFound from './pages/shared/NotFound';
import { useAuth } from './features/auth/AuthContext';

const AppRoutes = () => {
    const { role } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/complete-signup" element={<CompleteSignup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Requires valid session AND a completed role (handled by the intercept above) */}
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tasks" element={role === 'employee' ? <MyTasks /> : <TasksDashboard />} />
                    <Route path="/tasks/:taskId" element={<TaskDetails />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                </Route>
            </Route>

            {/* Protected Routes - Managers Only */}
            <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
                <Route element={<Layout />}>
                    <Route path="/analytics" element={<TeamAnalytics />} />
                    <Route path="/assign-task" element={<AssignTask />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/reports" element={<Reports />} />
                </Route>
            </Route>

            {/* Wildcard Match */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
