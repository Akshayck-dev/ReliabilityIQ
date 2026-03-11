# ReliabilityIQ — Shared UI Components

Framework: React 19 · CSS: Tailwind CSS v4 · Icons: Lucide React
Component location: `src/components/ui/`

---

## Button
**File**: `src/components/ui/Button.jsx`
Variants: `primary` (blue), `secondary` (slate outline), `danger` (red)

```jsx
import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        secondary: "border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700",
        danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    };
    return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};
export default Button;
```

---

## Card
**File**: `src/components/ui/Card.jsx`
White rounded container. Props: `noPadding`, `className`.

```jsx
import React from 'react';

const Card = ({ children, className = '', noPadding = false }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
        {children}
    </div>
);
export default Card;
```

---

## Badge (Status)
**File**: `src/components/ui/Badge.jsx`
Status-based coloured pill. Statuses: `completed` (green), `in_progress` (amber), `pending` (slate).

```jsx
import React from 'react';

const Badge = ({ status, className = '' }) => {
    const getStatusStyles = (s) => {
        switch (s?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
            case 'in_progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
            case 'pending': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };
    const label = status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles(status)} ${className}`}>{label}</span>;
};
export default Badge;
```

---

## PriorityBadge
**File**: `src/components/ui/PriorityBadge.jsx`
Bordered badge. Priorities: `high` (red), `medium` (amber), `low` (blue).

```jsx
import React from 'react';

const PriorityBadge = ({ priority, className = '' }) => {
    const getPriorityStyles = (p) => {
        switch (p?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            case 'low': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };
    return <span className={`px-2 py-0.5 border rounded text-xs font-semibold uppercase tracking-wider ${getPriorityStyles(priority)} ${className}`}>{priority ? priority.toUpperCase() : 'NORMAL'}</span>;
};
export default PriorityBadge;
```

---

## StatCard
**File**: `src/components/ui/StatCard.jsx`
KPI metric card with optional progress bar. Used on Dashboard.

```jsx
import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, trend = 'without trend', progress, progressText, icon: Icon, valueSuffix = '', iconColor = 'text-slate-600 dark:text-slate-300', iconBg = 'bg-slate-100 dark:bg-slate-800', className = '' }) => (
    <Card className={`flex flex-col justify-between ${className}`} noPadding>
        <div className="flex justify-between items-start">
            <div className="p-5">
                <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 tracking-tight">{title}</h3>
                <div className="flex items-center gap-1 mt-1.5">
                    <p className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">{value}</p>
                    {valueSuffix && <span className="text-xl font-medium text-slate-600 dark:text-slate-400 mt-1">{valueSuffix}</span>}
                </div>
                {progress === undefined && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tracking-tight">{trend}</p>}
            </div>
            {Icon && (
                <div className="p-5 pb-0 pl-0 shrink-0">
                    <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm`}>
                        <Icon strokeWidth={2} size={18} className={iconColor} />
                    </div>
                </div>
            )}
        </div>
        {progress !== undefined && (
            <div className="px-5 pb-5 mt-auto">
                <div className="flex justify-between items-end mb-2 gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight truncate">{progressText || trend}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ease-out ${iconColor.replaceAll('text-', 'bg-')}`} style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} />
                </div>
            </div>
        )}
    </Card>
);
export default StatCard;
```

---

## ConfirmModal
**File**: `src/components/ui/ConfirmModal.jsx`
Glassmorphism-style confirmation dialog. Variants: `warning`, `danger`, `info`.
Props: `isOpen`, `onConfirm`, `onCancel`, `title`, `message`, `confirmLabel`, `cancelLabel`, `variant`, `icon`, `loading`.

```jsx
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onConfirm, onCancel, title = 'Are you sure?', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'warning', icon: CustomIcon, loading = false }) => {
    if (!isOpen) return null;
    const variantStyles = {
        warning: { iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', confirmBtn: 'bg-amber-500 hover:bg-amber-600' },
        danger: { iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400', confirmBtn: 'bg-red-500 hover:bg-red-600' },
        info: { iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400', confirmBtn: 'bg-blue-500 hover:bg-blue-600' },
    };
    const styles = variantStyles[variant] || variantStyles.warning;
    const Icon = CustomIcon || AlertTriangle;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <button onClick={onCancel} className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={18} /></button>
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto rounded-2xl ${styles.iconBg} flex items-center justify-center mb-5`}><Icon size={28} className={styles.iconColor} /></div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                    {message && <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">{message}</p>}
                </div>
                <div className="flex gap-3 px-8 pb-8">
                    <button onClick={onCancel} disabled={loading} className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors disabled:opacity-50">{cancelLabel}</button>
                    <button onClick={onConfirm} disabled={loading} className={`flex-1 py-3 px-4 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 ${styles.confirmBtn}`}>{loading ? 'Processing...' : confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};
export default ConfirmModal;
```

---

## EmptyState
**File**: `src/components/ui/EmptyState.jsx`
Centered empty state with dashed border, icon, title, description, optional action.

```jsx
import React from 'react';
import { PackageOpen } from 'lucide-react';

const EmptyState = ({ icon: Icon = PackageOpen, title = 'No data found', description = 'There is currently no data to display here.', action }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
            <Icon size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">{description}</p>
        {action && <div className="mt-2">{action}</div>}
    </div>
);
export default EmptyState;
```

---

## Skeleton
**File**: `src/components/ui/Skeleton.jsx`
Animate-pulse placeholder. Multiple pre-built variants: `StatCardSkeleton`, `ListTaskRowSkeleton`, `TableTaskRowSkeleton`, `AnalyticsRowSkeleton`.

```jsx
export const Skeleton = ({ className, ...props }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md ${className}`} {...props} />
);
```
