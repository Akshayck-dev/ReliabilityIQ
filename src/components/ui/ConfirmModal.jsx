import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Premium confirmation modal with glassmorphism + smooth animations.
 * Replaces native window.confirm() with a styled dialog.
 */
const ConfirmModal = ({
    isOpen,
    onConfirm,
    onCancel,
    title = 'Are you sure?',
    message = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'warning', // 'warning' | 'danger' | 'info'
    icon: CustomIcon,
    loading = false
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        warning: {
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
            confirmBtn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-300 dark:focus:ring-amber-800',
        },
        danger: {
            iconBg: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600 dark:text-red-400',
            confirmBtn: 'bg-red-500 hover:bg-red-600 focus:ring-red-300 dark:focus:ring-red-800',
        },
        info: {
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
            confirmBtn: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-300 dark:focus:ring-blue-800',
        }
    };

    const styles = variantStyles[variant] || variantStyles.warning;
    const Icon = CustomIcon || AlertTriangle;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto rounded-2xl ${styles.iconBg} flex items-center justify-center mb-5`}>
                        <Icon size={28} className={styles.iconColor} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    {message && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                            {message}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-8 pb-8">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-3 px-4 text-white font-semibold text-sm rounded-xl transition-colors focus:ring-4 disabled:opacity-50 ${styles.confirmBtn}`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Processing...
                            </span>
                        ) : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
