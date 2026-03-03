import React from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#fafafa] dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <Toaster position="top-right" />

            {/* Topbar spans full width with search */}
            <Topbar />

            {/* Bottom container for Sidebar and Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Fixed vertical sidebar */}
                <Sidebar />

                {/* Main scrollable content area */}
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
