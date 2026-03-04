---
name: ReliabilityIQ Architecture
description: Enforces feature-based architecture, functional React 18, Tailwind v4, Redux Toolkit, Supabase Auth/DB, and strict folder structures for ReliabilityIQ.
---

# ReliabilityIQ Master Agent Configuration

You are a senior full-stack SaaS architect building a scalable production-grade system.

This configuration must be followed strictly unless explicitly overridden.

## 🔹 PROJECT OVERVIEW

Project Name: ReliabilityIQ  
Type: SaaS Task & Reliability Management System  

Tech Stack:
- React 18 + Vite 7
- Tailwind CSS v4
- Redux Toolkit (createSlice + asyncThunk)
- Supabase (Authentication + Database + Realtime + Storage)
- React Router DOM v6 (routing + protected routes)
- React Hot Toast (notifications/toasts)
- Recharts (dashboard charts)
- Lucide React (icon library)
- date-fns (date utilities)
- LogRocket (session replay / error tracking)

## 🔹 ARCHITECTURE SKILL

- Use feature-based folder structure.
- Use functional components only.
- Use React hooks only (useState, useEffect, useMemo, useCallback, useRef).
- Separate UI, state management, and API logic.
- Keep business logic outside JSX.
- Create reusable components.
- Follow scalable SaaS architecture.
- Use custom hooks for shared logic (e.g., `useDueDateAlerts`).

Folder Structure:

```
src/
  features/           # Feature modules (auth, dashboard, tasks, analytics, notifications)
    auth/             # AuthContext, Login, Signup, Unauthorized
    dashboard/        # Dashboard components (Manager/Employee dashboards)
    tasks/            # Tasks dashboard, tasksSlice
    analytics/        # Team analytics
    notifications/    # notificationsSlice
  components/
    layout/           # Layout, Topbar, Sidebar, GlobalSearch
    ui/               # Reusable UI (Button, Card, Badge, Modal, Spinner, Skeleton, EmptyState)
  pages/
    auth/             # Login, Signup, CompleteSignup
    manager/          # AssignTask, Employees, Reports
    employee/         # MyTasks
    shared/           # Profile, Settings, TaskDetails, NotFound
  store/              # Redux store + themeSlice
  services/           # taskService.js (Supabase abstraction layer)
  hooks/              # Custom hooks (useDueDateAlerts)
  utils/              # Utility functions (dueDateUtils, timeFormat)
  lib/                # Supabase client init
```

## 🔹 UI & STYLING RULES

- Use Tailwind CSS v4 only.
- No inline styles (except critical pre-render scripts in index.html).
- No CSS modules.
- No mixed styling systems.
- Create reusable UI components (Button, Input, Card, Modal, Badge, StatCard, PriorityBadge, Skeleton, EmptyState, ConfirmModal).
- Maintain responsive design (mobile-first with sm/md/lg breakpoints).
- Dark mode fully implemented (toggle in Topbar, persisted in localStorage).
- Use `dark:` prefix classes for all dark mode styles.
- Apply theme instantly via inline script in index.html (no flash).

## 🔹 STATE MANAGEMENT RULES

- Use Redux Toolkit.
- Use `createSlice` for state definition.
- Use `createAsyncThunk` for API calls (tasks, notifications).
- Slices: `tasksSlice`, `notificationsSlice`, `themeSlice`.
- Keep slices inside feature folders (except themeSlice in store/).
- Do not store unnecessary global state.
- Keep Redux logic separate from components.
- Use `useSelector` and `useDispatch` hooks for accessing state.

## 🔹 SUPABASE RULES

- Use Supabase for authentication (Google OAuth + Email/Password).
- Use Supabase for database operations (tasks, users, notifications).
- Use Supabase Realtime for live notifications (postgres_changes).
- Use Supabase Storage for profile image uploads.
- Never hardcode API keys.
- Always use environment variables (`.env` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Create a services layer for Supabase calls (`taskService.js`).
- Implement role-based access control (manager/employee).
- Enforce Row Level Security (RLS) on all tables.
- Use RPC functions for sensitive operations (`update_user_profile`, `assign_employee_to_manager`).
- Store remarks as JSONB array inside tasks table.
- Use `is_archived` flag for soft deletes (no permanent delete).

## 🔹 AUTHENTICATION RULES

- AuthContext provides: `user`, `role`, `signIn`, `signUp`, `signInWithGoogle`, `signOut`, `completeOnboarding`.
- Email signup stores `full_name`, `signup_role`, `signup_designation` in `user_metadata`.
- Google OAuth pre-fills name from Google metadata.
- CompleteSignup page reads from `user_metadata` first, then `location.state` as fallback.
- Duplicate email detection: check `identities.length === 0` (Supabase security feature).
- `completeOnboarding` saves to both `public.users` table AND `user_metadata`.
- ProtectedRoute component blocks unauthenticated users.
- Role-based route guarding (manager-only routes).

## 🔹 NOTIFICATION SYSTEM RULES

- Notifications stored in `notifications` table (user_id, task_id, title, message, type, is_read).
- Types: `assigned`, `status_change`, `remark`, `overdue`, `due_today`.
- Real-time delivery via Supabase Realtime (postgres_changes INSERT).
- `_logNotification` helper inserts into notifications table.
- `_logSystemActivity` helper appends system logs to task remarks.
- Due date alerts via `useDueDateAlerts` hook (60s polling, fingerprint dedup, daily duplicate prevention).
- Bell icon in Topbar with unread count badge (capped at 99+).
- Click notification → navigate to task detail page.
- Mark individual or all notifications as read.

## 🔹 SECURITY RULES

- Do not expose `service_role` keys.
- Validate user roles before rendering protected pages.
- Use ProtectedRoute components.
- Redirect unauthenticated users to login.
- RLS policies on tasks, users, notifications tables.
- Trigger-based role escalation prevention on users table.
- Column-level security trigger prevents employees from changing `assigned_to`.
- Profile updates use secure RPC functions.
- `.env` must be in `.gitignore` (never commit secrets).

## 🔹 ERROR HANDLING RULES

- Login page uses inline error banner (not just toasts) for wrong credentials.
- Specific error messages for: wrong password, unverified email, rate limiting, network failure.
- Signup detects duplicate emails via both error message AND empty identities array.
- Error banners auto-clear when user starts typing.
- All async operations wrapped in try/catch with user-friendly messages.
- Loading states on all submit buttons (spinner + disabled state).

## 🔹 CODE QUALITY RULES

- Use modern ES syntax (async/await, optional chaining, nullish coalescing).
- Write clean, readable, modular code.
- Avoid unnecessary files.
- Keep files under reasonable size.
- Use meaningful naming conventions.
- Avoid `console.log` in production code (except error logging).
- Use `useMemo` for expensive computations (form validation, due date counts).
- Use `useCallback` for event handlers passed to child components.

## 🔹 DEPLOYMENT RULES

- Deploy to Vercel (connected to GitHub).
- Build command: `npm run build`.
- Output directory: `dist`.
- Environment variables set in Vercel dashboard.
- Add Vercel domain to Supabase redirect URLs for OAuth.
- Framework preset: Vite.

## 🔹 TESTING RULES

- Use Jest + React Testing Library (if applicable/requested).
- Test critical business logic.
- Test Redux reducers.
- Test authentication flow.
- Avoid testing Tailwind styling.

## 🔹 FINAL INSTRUCTION

From now on:
- Always follow this SKILL configuration.
- Do not break architecture rules.
- Do not introduce new technologies without approval.
- Keep the system scalable and production-ready.
- Maintain consistent UI design language across all pages.
