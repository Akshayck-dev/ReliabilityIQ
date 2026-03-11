# ReliabilityIQ — Page Dependency Trees

Each page's complete dependency tree for use with `--context-file`.

---

## /dashboard
Entry: `src/features/dashboard/Dashboard.jsx`
```
src/features/dashboard/Dashboard.jsx
  src/features/dashboard/components/TaskTable.jsx
    src/components/ui/Card.jsx
    src/components/ui/Skeleton.jsx
    src/components/ui/EmptyState.jsx
  src/features/dashboard/components/DashboardCharts.jsx (if exists)
  src/components/ui/StatCard.jsx
    src/components/ui/Card.jsx
  src/components/ui/Skeleton.jsx
  src/features/auth/AuthContext.jsx
  src/features/tasks/tasksSlice.js
  src/utils/dueDateUtils.js
  src/hooks/useDueDateAlerts.js
```

---

## /tasks (Manager view)
Entry: `src/features/tasks/TasksDashboard.jsx`
```
src/features/tasks/TasksDashboard.jsx
  src/features/tasks/KanbanBoard.jsx
    src/features/tasks/KanbanColumn.jsx
      src/features/tasks/KanbanTaskCard.jsx
        src/components/ui/PriorityBadge.jsx
        src/components/ui/Badge.jsx
    src/features/tasks/TaskDetailsDrawer.jsx
      src/components/ui/ConfirmModal.jsx
      src/services/taskService.js
  src/features/tasks/tasksSlice.js
  src/components/ui/Skeleton.jsx
  src/components/ui/EmptyState.jsx
  src/features/auth/AuthContext.jsx
```

---

## /tasks (Employee view)
Entry: `src/pages/employee/MyTasks.jsx`
```
src/pages/employee/MyTasks.jsx
  src/features/tasks/tasksSlice.js
  src/components/ui/Badge.jsx
  src/components/ui/PriorityBadge.jsx
  src/components/ui/EmptyState.jsx
  src/components/ui/Skeleton.jsx
  src/features/tasks/TaskDetailsDrawer.jsx
  src/features/auth/AuthContext.jsx
```

---

## /employees
Entry: `src/pages/manager/Employees.jsx`
```
src/pages/manager/Employees.jsx
  src/services/taskService.js
  src/components/ui/Card.jsx
  src/components/ui/EmptyState.jsx
  src/components/ui/Skeleton.jsx
```

---

## /employees/:employeeId
Entry: `src/pages/manager/EmployeeProfile.jsx`
```
src/pages/manager/EmployeeProfile.jsx
  src/services/taskService.js
  src/components/ui/Card.jsx
  src/components/ui/Spinner.jsx
  recharts (LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer)
```

---

## /settings
Entry: `src/pages/shared/Settings.jsx`
```
src/pages/shared/Settings.jsx
  src/features/auth/AuthContext.jsx
  src/store/themeSlice.js
  src/components/ui/ConfirmModal.jsx
  src/lib/supabase.js
```

---

## /profile
Entry: `src/pages/shared/Profile.jsx`
```
src/pages/shared/Profile.jsx
  src/features/auth/AuthContext.jsx
  src/lib/supabase.js
  src/components/ui/Spinner.jsx
```

---

## /assign-task
Entry: `src/pages/manager/AssignTask.jsx`
```
src/pages/manager/AssignTask.jsx
  src/features/tasks/tasksSlice.js
  src/services/taskService.js
  src/features/auth/AuthContext.jsx
  src/components/ui/Button.jsx
```

---

## /performance
Entry: `src/pages/manager/Performance.jsx`
```
src/pages/manager/Performance.jsx
  src/services/taskService.js
  src/components/ui/Card.jsx
  src/components/ui/StatCard.jsx
  recharts
```

---

## Global always-include files
Always add these as `--context-file` for any page design:
- `src/index.css`
- `src/components/layout/Layout.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Topbar.jsx`
