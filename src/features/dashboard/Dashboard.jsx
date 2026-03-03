import React from 'react';
import { useAuth } from '../auth/AuthContext';
import ManagerDashboard from './ManagerDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import { FullPageSpinner } from '../../components/ui/Spinner';

const Dashboard = () => {
    const { role } = useAuth();

    if (!role) return <FullPageSpinner message="Verifying role..." />;

    if (role === 'employee') {
        return <EmployeeDashboard />;
    }

    // Default to manager for admins or managers
    return <ManagerDashboard />;
};

export default Dashboard;
