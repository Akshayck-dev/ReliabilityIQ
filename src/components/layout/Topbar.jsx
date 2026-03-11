import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, ChevronDown, Bell, CheckCircle2, Sun, Moon } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../../features/auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, notificationAdded } from '../../features/notifications/notificationsSlice';
import { toggleTheme } from '../../store/themeSlice';
import { formatRelativeTime } from '../../utils/timeFormat';
import { supabase } from '../../lib/supabase';
import { useSoundEffects } from '../../hooks/useSoundEffects';

const Topbar = () => {
    const { role, user } = useAuth();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux State
    const { items: notifications } = useSelector(state => state.notifications);
    const themeMode = useSelector(state => state.theme.mode);

    // Local UI State
    const [showNotifications, setShowNotifications] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const notificationRef = useRef(null);
    const prevFirstNotifIdRef = useRef(null);
    const { playNotification } = useSoundEffects();

    // 1. Initial Fetch
    useEffect(() => {
        if (user) {
            dispatch(fetchNotifications(user.id));
        }
    }, [user, dispatch]);

    // 2. Realtime Subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('notifications-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    // Dispatch action to update Redux optimally
                    dispatch(notificationAdded(payload.new));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, dispatch]);

    // 3. Animation Trigger
    useEffect(() => {
        const firstNotifId = notifications?.[0]?.id;
        if (firstNotifId && prevFirstNotifIdRef.current && firstNotifId !== prevFirstNotifIdRef.current) {
            setIsAnimating(true);
            playNotification();
            const timer = setTimeout(() => setIsAnimating(false), 800);
            prevFirstNotifIdRef.current = firstNotifId;
            return () => clearTimeout(timer);
        }
        if (firstNotifId) {
            prevFirstNotifIdRef.current = firstNotifId;
        }
    }, [notifications, playNotification]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif) => {
        if (!notif.is_read) {
            dispatch(markNotificationRead(notif.id));
        }
        setShowNotifications(false);
        if (notif.task_id) {
            navigate(`/tasks/${notif.task_id}`);
        }
    };

    const handleMarkAllRead = () => {
        if (user) {
            dispatch(markAllNotificationsRead(user.id));
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const displayUnread = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <header className="h-[72px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-20 w-full relative shrink-0 transition-colors">
            {/* Logo Area */}
            <div className="flex items-center gap-1.5 w-[200px]">
                <h1 className="text-[22px] font-bold tracking-tight text-[#0f172a] dark:text-white">
                    Reliability<span className="font-semibold text-blue-600 dark:text-blue-400">IQ</span>
                </h1>
            </div>

            {/* Center Search Area */}
            <div className="flex-1 flex justify-center max-w-2xl px-8">
                <GlobalSearch />
            </div>

            {/* Right User Profile & Notifications */}
            <div className="flex items-center justify-end w-[280px] gap-4">
                {/* Theme Toggle Button */}
                <button
                    onClick={() => dispatch(toggleTheme())}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                    aria-label="Toggle Dark Mode"
                >
                    {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                {/* Notifications Bell */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors focus:outline-none ${isAnimating ? 'animate-bell-shake text-blue-600 dark:text-blue-400' : ''}`}
                    >
                        <Bell size={20} className={isAnimating ? 'fill-current' : ''} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                                {displayUnread}
                            </span>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-[350px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                            {displayUnread} New
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[360px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell size={28} className="mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm font-medium text-slate-500">No notifications yet.</p>
                                        <p className="text-xs text-slate-400 mt-1">When tasks are assigned or updated, you'll see them here.</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map(notif => (
                                            <button
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                            >
                                                {!notif.is_read ? (
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                                                ) : (
                                                    <CheckCircle2 size={12} className="text-slate-300 mt-1 shrink-0" />
                                                )}
                                                <div className="flex-1">
                                                    <p className={`text-[13px] ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2 pr-2">
                                                        {notif.message}
                                                    </p>
                                                    <span className="text-[10px] font-bold text-slate-400 mt-2 inline-block">
                                                        {formatRelativeTime(notif.created_at)}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Button */}
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 bg-white hover:bg-slate-50 transition-colors py-1.5 px-1.5 pr-4 rounded-full border border-slate-200 shadow-sm"
                >
                    <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-slate-200 bg-slate-100 text-slate-600">
                        {user?.user_metadata?.profile_image ? (
                            <img src={user.user_metadata.profile_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        )}
                    </div>
                    <span className="text-[13px] font-bold text-[#0f172a] truncate max-w-[120px]">
                        {user?.user_metadata?.name || (role === 'manager' ? 'Manager Profile' : 'Employee Profile')}
                    </span>
                    <ChevronDown size={14} className="text-slate-400" />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
