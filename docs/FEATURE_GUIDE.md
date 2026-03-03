# ReliabilityIQ — Feature Guide (How Everything Works)

A clear, simple explanation of every feature. Perfect for interviews and understanding the project.

---

## 1. 🔔 Notification System (In-App)

### How it works (step by step):

```
Action happens (task assigned, remark added, due date)
        ↓
taskService._logNotification() inserts a row into `notifications` table
        ↓
Supabase Realtime detects the INSERT via postgres_changes
        ↓
Topbar.jsx receives the event and dispatches notificationAdded() to Redux
        ↓
Bell icon updates with unread count badge instantly
```

### Key points:
- **Stored in DB** — `notifications` table (user_id, task_id, title, message, type, is_read)
- **Real-time** — uses Supabase Realtime channel, no page refresh needed
- **Click to navigate** — clicking a notification takes you to that task's detail page
- **Mark as read** — individually or "Mark all as read" button
- **Types**: `assigned`, `status_change`, `remark`, `overdue`, `due_today`

### When notifications are automatically sent:

| Event | Who gets notified | Type |
|-------|------------------|------|
| Manager creates & assigns task | Employee | `assigned` |
| Manager reassigns task | New employee | `assigned` |
| Employee/manager adds a remark | The other party | `remark` |
| Task status changes (pending → in_progress → completed) | Manager | `status_change` |
| Task is overdue | Both employee + manager | `overdue` |
| Task is due today | Both employee + manager | `due_today` |

---

## 2. ⏰ Due Date Alerts

### How it works:

The `useDueDateAlerts` hook runs on both Manager and Employee dashboards:

1. **Every 60 seconds**, it re-fetches all tasks from Supabase
2. For each task, `getDueStatus()` classifies it:
   - **Overdue** — due_date is before today
   - **Due Today** — due_date is today
   - **Due Soon** — due_date is within next 2 days
3. For overdue & due-today tasks, it inserts a notification

### Duplicate prevention:
- **Fingerprint system** — creates a hash of all task IDs + statuses. If the same hash was already processed, it skips
- **Daily check** — before inserting a notification, it queries the DB: "was a notification with the same task_id + type already created today?" If yes, skip

### Who gets alerted:
- **Both** the assigned employee AND the manager get notified
- Completed tasks are excluded from alerts

---

## 3. 💬 Remarks Section (Instant Comments)

### How it works:

Remarks are stored as a **JSONB array** inside the `tasks` table (column: `remarks`). Each remark object:

```json
{
  "id": "17093847201abc123",
  "text": "Please prioritize this task",
  "author_email": "manager@company.com",
  "type": "user",           
  "created_at": "2026-03-01T10:30:00Z"
}
```

### Two types of remarks:
1. **User remarks** (`type: "user"`) — typed by manager or employee
2. **System logs** (`type: "system"`) — auto-generated, e.g. "Task reassigned to new employee", "Status changed to in_progress"

### Adding a remark (step by step):

```
User types remark in TaskDetails page → clicks Send
        ↓
addRemarkToTask() in taskService:
  1. Fetches current remarks array from DB
  2. Appends new remark object
  3. Updates the task with the full array
        ↓
Automatic notification sent:
  - If employee posted → manager gets notified
  - If manager posted → employee gets notified
  - The poster does NOT get their own notification
```

### Key points:
- **No separate table** — remarks live inside the task row as JSONB
- **Instant** — shows immediately after adding
- **Both roles can post** — managers and employees can remark on the same task
- **Activity trail** — system logs (reassignment, status change) appear in the same timeline

---

## 4. 📋 Task Assignment Flow

### When Manager creates a new task:

```
Manager fills AssignTask form (title, description, priority, due date, employee)
        ↓
createTask() in taskService:
  1. Creates initial system log: "Task created in system"
  2. Inserts task into `tasks` table with remarks = [initial log]
  3. If assigned_to is set → sends notification to employee
        ↓
Employee sees notification bell update in real-time
Employee sees the task in their "My Tasks" page
```

### When Manager reassigns an existing task:

```
Manager clicks "Reassign" on a task → picks new employee
        ↓
assignTask() in taskService:
  1. Updates assigned_to in the DB
  2. Logs system activity: "Task reassigned to new employee"
  3. Sends notification to new employee
        ↓
New employee immediately sees the task + notification
```

### Task data stored:
- `title`, `description`, `status`, `priority`, `due_date`
- `assigned_to` (employee UUID)
- `manager_id` (auto-set to creating manager's UUID)
- `parent_task_id` (for linked/sub-tasks)
- `remarks` (JSONB array)
- `is_archived` (soft delete flag)

---

## 5. 📊 Reliability Score & Analytics

### How it's calculated:

```
Reliability Score = (Tasks completed on time / Total completed tasks) × 100
```

- Tasks completed **before or on** due_date = on time ✅
- Tasks completed **after** due_date = late ❌
- Tasks with no due_date are excluded

### Where it's shown:
- **Team Analytics page** (managers only) — bar chart per employee
- **Employee Dashboard** — personal score
- The `getEmployeeReliabilityStats()` function calculates this per employee

---

## 6. 🗄️ Task Archiving (Soft Delete)

Instead of permanently deleting tasks, managers **archive** them:

```
Manager clicks "Archive Task" → Confirm modal appears → Confirms
        ↓
archiveTask() sets is_archived = true in DB
        ↓
Task disappears from active views (getAllTasks filters is_archived = false)
Task appears in "Archived" tab on Tasks Dashboard
        ↓
Manager can click "Restore" anytime to bring it back
```

**Why archive instead of delete?**
- Preserves audit trail and remarks history
- No data loss — can be restored
- Reliability scores remain accurate

---

## 7. 🔍 Global Search

Available in the top bar for quick navigation:

- **Managers** can search: tasks they created + employees in their team
- **Employees** can search: tasks assigned to them

Uses `ilike` queries (case-insensitive partial matching) on task titles and employee names.

---

## 8. 🔗 Linked Tasks (Parent-Child)

Tasks can be linked as sub-tasks:

- When creating a task, you can set a `parent_task_id`
- `getLinkedTasks()` fetches both the parent and all children
- Shown in `TaskDetails` under "Linked Tasks" section

---

## 9. 🌙 Dark Mode

- Toggle via sun/moon icon in topbar
- State persisted in Redux (`themeSlice`) + `localStorage`
- Applies globally via `dark:` Tailwind classes
- Background color set on both `documentElement` and `body`

---

## 10. 🔐 Authentication Flow

### Email Signup:
```
Signup page (name, email, password, role, designation)
    ↓
supabase.auth.signUp() → creates auth user
    ↓
If email confirmation ON → "Check Your Email" screen
If email confirmation OFF → auto-login
    ↓
/complete-signup → saves name + role + designation to `users` table
    ↓
Dashboard
```

### Google OAuth:
```
Click "Continue with Google" → Supabase OAuth redirect
    ↓
Returns to app → AuthContext detects session
    ↓
If new user (role = pending_signup) → /complete-signup
If existing user → Dashboard
```

### Duplicate email detection:
- When email confirmation is ON, Supabase returns `identities: []` for existing emails
- App detects this and shows "This email is already registered"

---

## 11. 🛡️ Security (RLS)

- **Row Level Security** on `tasks` and `users` tables
- Employees can only see/update their own tasks
- Managers can see/update tasks they created
- Role escalation prevention trigger on `users` table
- Column-level security trigger prevents employees from changing `assigned_to`

---

## Quick Summary for Interviews

> "ReliabilityIQ is a task management system built with React, Redux Toolkit, Supabase, and Tailwind CSS. It has two roles — Manager and Employee. Managers assign tasks with due dates, and the system automatically tracks who completes tasks on time, generating a Reliability Score. It has real-time notifications using Supabase Realtime (no polling for notifications — only for due date checks every 60s). Remarks work like a chat inside each task, stored as JSONB. Tasks are archived instead of deleted to keep the audit trail. Security is enforced using Supabase RLS policies. Authentication supports both Google OAuth and email/password signup."
