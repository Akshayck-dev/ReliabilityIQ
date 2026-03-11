# ReliabilityIQ — Layout Components

All layout components are in `src/components/layout/`.

---

## Layout (App Shell)
**File**: `src/components/layout/Layout.jsx`
Root shell: fixed inset, flex column. Topbar on top, Sidebar + main content below.
Background: `bg-[#fafafa] dark:bg-[#0b1120]`

```jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';
import { useTaskRealtime } from '../../hooks/useTaskRealtime';

const Layout = () => {
    useTaskRealtime();
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Toaster position="top-right" />
            <Topbar />
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar />
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8 relative flex flex-col items-center">
                    <div className="w-full max-w-[1600px] flex-1 pb-16">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
export default Layout;
```

---

## Topbar
**File**: `src/components/layout/Topbar.jsx`
Height: `h-[72px]`. Three-section flex: Logo (left, 200px) · GlobalSearch (center) · Actions (right, 280px).
Actions: Theme toggle (Sun/Moon) · Bell with unread count badge · Profile avatar button.

```jsx
// Key structure:
<header className="h-[72px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-20 w-full relative shrink-0 transition-colors">
    {/* Logo */}
    <div className="flex items-center gap-1.5 w-[200px]">
        <h1 className="text-[22px] font-bold tracking-tight text-[#0f172a] dark:text-white">
            Reliability<span className="font-semibold text-blue-600 dark:text-blue-400">IQ</span>
        </h1>
    </div>

    {/* Search */}
    <div className="flex-1 flex justify-center max-w-2xl px-8">
        <GlobalSearch />
    </div>

    {/* Right: Theme + Bell + Profile */}
    <div className="flex items-center justify-end w-[280px] gap-4">
        <button onClick={() => dispatch(toggleTheme())} aria-label="Toggle Dark Mode">
            {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {/* Bell with numeric badge */}
        <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-900">
                        {displayUnread}
                    </span>
                )}
            </button>
            {/* Notification dropdown — 350px wide, dark-mode aware */}
        </div>
        {/* Profile pill button */}
        <button onClick={() => navigate('/profile')} className="flex items-center gap-3 bg-white hover:bg-slate-50 py-1.5 px-1.5 pr-4 rounded-full border border-slate-200 shadow-sm">
            <div className="h-8 w-8 rounded-full ...">{ /* avatar or initials */ }</div>
            <span className="text-[13px] font-bold text-[#0f172a] truncate max-w-[120px]">{ user name }</span>
            <ChevronDown size={14} className="text-slate-400" />
        </button>
    </div>
</header>
```

---

## Sidebar
**File**: `src/components/layout/Sidebar.jsx`
Width: `w-[100px]`. Icon-only vertical nav, role-filtered.
Active state: `bg-[#f0f4ff] dark:bg-blue-500/10` with blue icon/label.

```jsx
<aside className="w-[100px] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-6 shrink-0 z-10">
    <nav className="flex flex-col gap-2">
        {/* Each item: icon (22px) + label (10px bold), stacked center */}
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center py-4 px-2 mx-2 rounded-xl transition-all ...`}>
            {({ isActive }) => (
                <>
                    <LayoutDashboard size={22} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">Dashboard</span>
                </>
            )}
        </NavLink>
        {/* Manager-only: Team, Performance, Reports */}
        {/* Shared: Tasks, Settings */}
    </nav>
</aside>
```

Nav items by role:
- **Both**: Dashboard, Tasks, Settings
- **Manager only**: Team (`/employees`), Performance, Reports
