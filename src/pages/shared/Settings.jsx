import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useDispatch } from 'react-redux';
import { setTheme } from '../../store/themeSlice';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Shield, Sun, Moon, Bell, Clock, ListChecks,
    Calendar, LogOut, Loader2, Check, ChevronDown, Archive, Trash2, AlertTriangle
} from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';

const Toggle = ({ enabled, onChange, label, description, icon: Icon }) => (
    <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
            {Icon && (
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-slate-500 dark:text-slate-400" />
                </div>
            )}
            <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-[#ea580c]' : 'bg-slate-300 dark:bg-slate-600'
                }`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
        </button>
    </div>
);

const SectionCard = ({ title, children }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">{title}</h2>
        {children}
    </div>
);

const Settings = () => {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Account
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Preferences
    const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
    const [notifications, setNotifications] = useState(() => localStorage.getItem('riq_notifications') !== 'false');
    const [deadlineReminders, setDeadlineReminders] = useState(() => localStorage.getItem('riq_deadline_reminders') !== 'false');

    // Manager settings
    const [defaultPriority, setDefaultPriority] = useState(() => localStorage.getItem('riq_default_priority') || 'medium');
    const [defaultDueDays, setDefaultDueDays] = useState(() => localStorage.getItem('riq_default_due_days') || '7');

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (user) setName(user.user_metadata?.name || '');
    }, [user]);

    const hasNameChanged = name.trim() !== (user?.user_metadata?.name || '');
    const isNameValid = name.trim().length >= 2 && name.trim().length <= 50;

    const handleSaveName = async () => {
        if (!hasNameChanged || !isNameValid) return;
        setIsSaving(true);
        try {
            const { error: authError } = await supabase.auth.updateUser({ data: { name: name.trim() } });
            if (authError) throw authError;

            const { error: dbError } = await supabase.rpc('update_user_profile', {
                new_name: name.trim(),
                new_avatar_url: user?.user_metadata?.profile_image || null,
                new_designation: null
            });
            if (dbError) throw dbError;
            toast.success('Name updated');
        } catch (err) {
            toast.error(err.message || 'Failed to update name');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleDark = (val) => {
        setDarkMode(val);
        dispatch(setTheme(val ? 'dark' : 'light'));
    };

    const handleToggleNotifications = (val) => {
        setNotifications(val);
        localStorage.setItem('riq_notifications', val.toString());
        toast.success(val ? 'Notifications enabled' : 'Notifications disabled');
    };

    const handleToggleReminders = (val) => {
        setDeadlineReminders(val);
        localStorage.setItem('riq_deadline_reminders', val.toString());
        toast.success(val ? 'Deadline reminders enabled' : 'Deadline reminders disabled');
    };

    const handleDefaultPriority = (e) => {
        setDefaultPriority(e.target.value);
        localStorage.setItem('riq_default_priority', e.target.value);
        toast.success('Default priority updated');
    };

    const handleDefaultDueDays = (e) => {
        const val = e.target.value;
        if (val && parseInt(val) > 0) {
            setDefaultDueDays(val);
            localStorage.setItem('riq_default_due_days', val);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            navigate('/login', { replace: true });
        } catch {
            toast.error('Failed to logout');
            setIsLoggingOut(false);
        }
    };

    const confirmLogout = () => {
        setShowLogoutModal(true);
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto py-8 px-4 sm:px-8 w-full animate-fade-in">
            <div className="mb-8">
                <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">Settings</h1>
                <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">Manage your account, preferences, and application settings.</p>
            </div>

            <div className="flex flex-col gap-6">

                {/* ─── Account ─── */}
                <SectionCard title="Account">
                    {/* Name */}
                    <div className="mb-5">
                        <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Display Name</label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                            <button
                                onClick={handleSaveName}
                                disabled={!hasNameChanged || !isNameValid || isSaving}
                                className="shrink-0 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                Save
                            </button>
                        </div>
                    </div>

                    {/* Email + Role readonly */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                </div>
                                <input readOnly disabled value={user?.email || ''} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Role</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Shield className="h-4 w-4 text-slate-400" />
                                </div>
                                <input readOnly disabled value={role === 'manager' ? 'Manager' : 'Employee'} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-sm" />
                            </div>
                        </div>
                    </div>
                </SectionCard>

                {/* ─── Preferences ─── */}
                <SectionCard title="Preferences">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <Toggle
                            enabled={darkMode}
                            onChange={handleToggleDark}
                            label="Dark Mode"
                            description="Switch between light and dark theme"
                            icon={darkMode ? Moon : Sun}
                        />
                        <Toggle
                            enabled={notifications}
                            onChange={handleToggleNotifications}
                            label="In-App Notifications"
                            description="Receive alerts for task updates and team activity"
                            icon={Bell}
                        />
                        <Toggle
                            enabled={deadlineReminders}
                            onChange={handleToggleReminders}
                            label="Deadline Reminders"
                            description="Get notified before task deadlines"
                            icon={Clock}
                        />
                    </div>
                </SectionCard>

                {/* ─── Manager Settings ─── */}
                {role === 'manager' && (
                    <SectionCard title="Manager Settings">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Default Task Priority</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <ListChecks className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <select
                                        value={defaultPriority}
                                        onChange={handleDefaultPriority}
                                        className="w-full pl-10 pr-10 py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-slate-800 dark:text-slate-200 mb-2">Default Due Days</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="number"
                                        min="1"
                                        max="90"
                                        value={defaultDueDays}
                                        onChange={handleDefaultDueDays}
                                        onBlur={() => toast.success('Default due days updated')}
                                        className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] dark:bg-slate-800 border-slate-200 dark:border-slate-700 border rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5">Number of days after assignment when tasks are due by default.</p>
                            </div>
                        </div>
                    </SectionCard>
                )}

                {/* ─── Security ─── */}
                <SectionCard title="Security">
                    {/* Auth Provider */}
                    <div className="flex items-center justify-between py-3 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Login Provider</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Authenticated via Google SSO</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">Connected</span>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={confirmLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-900/15 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-900/30 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                        {isLoggingOut ? 'Logging out...' : 'Sign Out'}
                    </button>

                    <ConfirmModal
                        isOpen={showLogoutModal}
                        onConfirm={handleLogout}
                        onCancel={() => setShowLogoutModal(false)}
                        title="Sign Out"
                        message="Are you sure you want to sign out of your account?"
                        confirmLabel="Yes, Sign Out"
                        cancelLabel="Cancel"
                        variant="danger"
                        icon={LogOut}
                        loading={isLoggingOut}
                    />
                </SectionCard>
            </div>
        </div>
    );
};

export default Settings;
