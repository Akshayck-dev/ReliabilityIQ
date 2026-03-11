# ReliabilityIQ — Routes

Router: React Router DOM v7 (config-based in `src/AppRoutes.jsx`)
Layout: `src/components/layout/Layout.jsx` wraps all protected routes.

## Full Router Config (`src/AppRoutes.jsx`)

```jsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/complete-signup" element={<CompleteSignup />} />
  <Route path="/unauthorized" element={<Unauthorized />} />

  {/* Protected — any authenticated role */}
  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tasks" element={role === 'employee' ? <MyTasks /> : <TasksDashboard />} />
      <Route path="/tasks/:taskId" element={<TaskDetails />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile" element={<Profile />} />
    </Route>
  </Route>

  {/* Protected — Manager Only */}
  <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
    <Route element={<Layout />}>
      <Route path="/performance" element={<Performance />} />
      <Route path="/assign-task" element={<AssignTask />} />
      <Route path="/employees" element={<Employees />} />
      <Route path="/employees/:employeeId" element={<EmployeeProfile />} />
      <Route path="/reports" element={<Reports />} />
    </Route>
  </Route>

  <Route path="*" element={<NotFound />} />
</Routes>
```

## Route Summary

| URL | Component File | Role | Description |
|-----|---------------|------|-------------|
| `/login` | `src/pages/auth/Login.jsx` | Public | Email/Google sign-in |
| `/signup` | `src/pages/auth/Signup.jsx` | Public | Registration |
| `/complete-signup` | `src/pages/auth/CompleteSignup.jsx` | Public | Onboarding (role/designation) |
| `/dashboard` | `src/features/dashboard/Dashboard.jsx` | Both | Stats + recent tasks + team overview |
| `/tasks` | `src/features/tasks/TasksDashboard.jsx` (mgr) / `src/pages/employee/MyTasks.jsx` (emp) | Both | Task management |
| `/tasks/:taskId` | `src/pages/shared/TaskDetails.jsx` | Both | Full task detail page |
| `/settings` | `src/pages/shared/Settings.jsx` | Both | Account, preferences, security |
| `/profile` | `src/pages/shared/Profile.jsx` | Both | Profile + avatar upload |
| `/employees` | `src/pages/manager/Employees.jsx` | Manager | Team list |
| `/employees/:employeeId` | `src/pages/manager/EmployeeProfile.jsx` | Manager | Individual performance |
| `/performance` | `src/pages/manager/Performance.jsx` | Manager | Analytics |
| `/assign-task` | `src/pages/manager/AssignTask.jsx` | Manager | Task creation/assignment |
| `/reports` | `src/pages/manager/Reports.jsx` | Manager | Reports |
