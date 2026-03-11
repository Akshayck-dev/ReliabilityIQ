# ReliabilityIQ — Extractable Components

Shared primitives that appear across ≥2 pages and are good candidates for SuperDesign DraftComponents.

---

## 1. StatusBadge (inline in TaskDetailsDrawer — should be extracted)
**Currently**: defined inline in `src/features/tasks/TaskDetailsDrawer.jsx`
**Statuses**: `pending` → "To Do" (slate), `in_progress` → "In Progress" (blue), `review` → "In Review" (purple), `completed` → "Completed" (green)
**Suggestion**: Extract to `src/components/ui/StatusBadge.jsx` — mirrors the existing `Badge.jsx` but adds `review` support and human-readable labels.

---

## 2. PageHeader
**Pattern seen in**: Settings, EmployeeProfile, Dashboard
**Pattern**: Large bold title + subtitle below, consistent spacing.
```jsx
<div className="mb-8">
    <h1 className="text-[28px] font-bold text-[#0f172a] dark:text-white tracking-tight">{title}</h1>
    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
</div>
```

---

## 3. SectionCard (extracted in Settings, could be shared)
**Currently**: defined inline in `src/pages/shared/Settings.jsx`
**Pattern**: White rounded card with uppercase label + children.
```jsx
<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
    <h2 className="text-[13px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">{title}</h2>
    {children}
</div>
```

---

## 4. DataTable
**Pattern seen in**: `EmployeeProfile` (recent tasks), `TaskTable` (employee performance), `Reports`
**Common pattern**: themed `<table>` with slate thead, row hover, divide-y body.
Good candidate to extract to `src/components/ui/DataTable.jsx`.

---

## 5. Toggle
**Currently**: defined inline in `src/pages/shared/Settings.jsx`
**Pattern**: Label + description on left, animated pill toggle on right.
```jsx
<div className="flex items-center justify-between py-4">
    <div className="flex items-center gap-3">
        {Icon && <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><Icon size={18} /></div>}
        <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    </div>
    <button onClick={() => onChange(!enabled)} className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
</div>
```

---

## 6. AvatarInitial
**Pattern seen in**: Topbar (profile button), CommentSection (comment avatars), EmployeeProfile header
**Pattern**: Circle with first letter of email/name, initials style.
```jsx
<div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
    {(name?.[0] || 'U').toUpperCase()}
</div>
```
