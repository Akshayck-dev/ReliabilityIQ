import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ListTodo,
    BarChart2,
    LineChart,
    Settings
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

const Sidebar = () => {
    const { role } = useAuth();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['manager', 'employee'] },
        { path: '/employees', icon: Users, label: 'Team', roles: ['manager'] },
        { path: '/performance', icon: LineChart, label: 'Performance', roles: ['manager'] },
        { path: '/tasks', icon: ListTodo, label: 'Tasks', roles: ['manager', 'employee'] },
        { path: '/reports', icon: BarChart2, label: 'Reports', roles: ['manager'] },
        { path: '/settings', icon: Settings, label: 'Settings', roles: ['manager', 'employee'] }
    ];

    const visibleNavItems = navItems.filter(item => item.roles.includes(role));

    return (
        <aside className="w-[100px] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-6 shrink-0 z-10 transition-colors duration-200">
            <nav id="tour-sidebar" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center py-4 px-2 mx-2 rounded-xl transition-all group relative overflow-hidden ${isActive
                                    ? 'bg-[#f0f4ff] dark:bg-blue-500/10'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={22}
                                        className={`mb-1.5 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                            }`}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    <span className={`text-[10px] font-bold text-center tracking-wide leading-tight ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                        }`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
