# ReliabilityIQ — Simple Project Explanation

> Use this document to explain your project in interviews or presentations.

---

## 1. What is this project?

**ReliabilityIQ** is a web application where managers can assign tasks to their employees and track how reliable each employee is at completing tasks on time.

Think of it like a **smart to-do list for teams** — but with a twist. It doesn't just track what tasks are done. It also calculates a **Reliability Score** for every employee, which tells the manager how dependable that person is.

---

## 2. What problem does it solve?

In many companies, managers assign work through WhatsApp, email, or verbal instructions. This causes problems:

- **Tasks get forgotten** — no one remembers what was assigned last week
- **No way to measure** — who is consistently on time and who is always late?
- **Overdue tasks go unnoticed** — managers find out too late
- **Deleted tasks lose history** — once deleted, there's no record

ReliabilityIQ solves all of these by giving managers a **dashboard** that shows task statuses, alerts for overdue work, and a numeric score for each employee's on-time performance.

---

## 3. What technologies did I use?

| Technology | What it does in my project |
|---|---|
| **React** | Builds the user interface (what users see and click) |
| **Supabase** | Handles the backend — database, login system, file storage, and real-time updates |
| **Redux Toolkit** | Manages shared data across the app (like task lists and notifications) |
| **Tailwind CSS** | Styles the interface — colors, spacing, fonts, responsive design |
| **React Router** | Handles page navigation (dashboard, tasks, settings, etc.) |
| **Vite** | Development tool that makes the app run fast during development |
| **Recharts** | Draws charts and graphs on the analytics page |
| **date-fns** | Helps work with dates (calculate overdue, format dates) |

### Why these choices?

- **React** is the most popular frontend library — great for building interactive UIs
- **Supabase** is like Firebase but uses PostgreSQL — I don't need to write a separate backend server
- **Redux** keeps my app's data organized when multiple components need the same information
- **Tailwind** lets me style things quickly without writing separate CSS files

---

## 4. How does login work?

I used **Google Authentication** through Supabase. Here's the simple flow:

1. User opens the app and sees the **Login page**
2. They click **"Continue with Google"**
3. Google verifies their identity and sends them back to the app
4. The app checks: **"Is this person already registered?"**
   - **Yes** → Take them to the dashboard
   - **No** → Take them to a **Complete Signup** page where they enter their name and choose their role (Manager or Employee)
5. After signup, their profile is saved in the database

I also support **email + password** login as a backup option.

### Why Google login?

- Users don't need to remember another password
- It's more secure (Google handles password security)
- It's faster — just one click

---

## 5. What can managers do?

Managers are the "admins" of the system. They can:

| Action | How it works |
|---|---|
| **See the dashboard** | Shows total employees, tasks assigned, completed tasks, overdue count, and the team's overall reliability score |
| **Create new tasks** | Fill out a form with title, description, priority, deadline, and assign it to an employee |
| **View all team tasks** | See every task they've created — with status, assignee, and due date |
| **Archive tasks** | Instead of deleting, managers can archive tasks (hide them from the main view) |
| **Restore archived tasks** | Bring back archived tasks if needed |
| **View employee list** | See all employees and their individual reliability scores |
| **View analytics** | Charts showing task completion trends over time |
| **Get automatic alerts** | Notifications when tasks are overdue or due today |

---

## 6. What can employees do?

Employees have a simpler, focused view:

| Action | How it works |
|---|---|
| **See their dashboard** | Shows their personal stats — total tasks, completed, pending, overdue, and their reliability score |
| **View assigned tasks** | A table showing all tasks assigned to them with deadlines and status |
| **Start a task** | Click "Start Work" to change status from Pending to In Progress |
| **Complete a task** | Click "Mark Complete" to finish a task |
| **Add remarks** | Leave comments on tasks (like a mini chat with the manager) |
| **Get notifications** | Notified when a new task is assigned or when a deadline is close |

### What employees CANNOT do:

- ❌ Create or assign tasks
- ❌ Edit task details (title, description, deadline)
- ❌ Archive or restore tasks
- ❌ View other employees' tasks
- ❌ Access analytics or reports pages

This is enforced both in the **frontend** (pages are hidden) and the **backend** (database security rules prevent it even if someone tries to hack the API).

---

## 7. How do tasks work?

A task goes through this simple lifecycle:

```
Manager Creates Task
        ↓
   Task is "Pending"
        ↓
 Employee clicks "Start Work"
        ↓
   Task is "In Progress"
        ↓
 Employee clicks "Mark Complete"
        ↓
   Task is "Completed" ✅
        ↓
 Manager can "Archive" it later
        ↓
   Task is hidden but saved 📦
```

### Task details include:

- **Title** — What the task is about
- **Description** — Detailed instructions
- **Priority** — Low, Medium, or High
- **Due Date** — When it must be finished
- **Assigned To** — Which employee should do it
- **Status** — Pending → In Progress → Completed
- **Remarks** — A conversation thread between manager and employee

---

## 8. What is the Reliability Score?

The Reliability Score is the **core idea** of this project. It's a simple percentage that answers one question:

> **"Out of all the tasks assigned to this employee, how many did they finish on time?"**

### Formula:

```
Reliability Score = (Tasks completed on time ÷ Total tasks assigned) × 100
```

### Example:

- Employee A has 10 tasks assigned
- They completed 8 of them before the deadline
- Reliability Score = (8 ÷ 10) × 100 = **80%**

### Why is this useful?

- Managers can **quickly see** who is reliable and who needs support
- Employees can **track their own performance** and improve
- It creates **accountability** — everyone knows their work is being measured
- During performance reviews, managers have **data** instead of guessing

The score is shown:
- On the **Manager Dashboard** — as "Overall Reliability" (team average)
- On the **Employee Dashboard** — as "My Reliability Score" (personal)
- On the **Employees page** — individual score for each team member

---

## 9. How do due date alerts work?

The alert system is **fully automatic**. Nobody needs to press a button to trigger it.

### How it works (step by step):

1. When the dashboard loads, it fetches all tasks from the database
2. A custom function checks each task's due date and puts it in one of these categories:
   - 🔴 **Overdue** — Due date has already passed and the task isn't completed
   - 🟡 **Due Today** — The deadline is today
   - 🔵 **Due Soon** — The deadline is within the next 2 days
3. These counts are displayed as **stat cards** on the dashboard
4. For overdue and due-today tasks, the system **automatically creates notifications** (the bell icon at the top right)
5. To avoid spam, it checks: "Did I already send this alert today?" — if yes, it doesn't send again
6. Every **60 seconds**, the system re-checks all tasks automatically (no page refresh needed)

### Who gets notified?

- The **employee** assigned to the task
- The **manager** who created the task

Both receive the notification so no overdue task goes unnoticed.

---

## 10. Why archive instead of delete?

In the beginning, the app had a **Delete** button for tasks. I replaced it with **Archive** for these reasons:

### Problems with permanent delete:

| Problem | Explanation |
|---|---|
| **Lost data** | Once deleted, you can never see that task again |
| **No audit trail** | You can't prove what work was assigned o r completed |
| **Accidental deletion** | Clicking delete by mistake means the data is gone forever |
| **Reliability score breaks** | If you delete completed tasks, the score calculation becomes inaccurate |

### Benefits of archive:

| Benefit | Explanation |
|---|---|
| **Data is preserved** | Archived tasks are hidden but still saved in the database |
| **Reversible** | Managers can restore archived tasks anytime with one click |
| **Clean dashboard** | Active tasks view stays uncluttered — old tasks move to the "Archived" tab |
| **Accurate scores** | Reliability scores remain correct because no task data is lost |
| **Professional practice** | Real-world applications almost never permanently delete data — they soft-delete it |

### How it works in the app:

- On the **Task Details** page, managers see an **"Archive Task"** button (amber colored)
- A nice confirmation popup asks: "Are you sure?"
- After archiving, the task disappears from the active view
- On the **Tasks page**, managers can switch to the **"Archived"** tab to see all archived tasks
- Each archived task has a **"Restore"** button to bring it back

---

## Quick Summary for Interview

> "I built **ReliabilityIQ**, a task management platform for teams. It has two roles — **Manager** and **Employee**. Managers assign tasks with deadlines, and employees complete them. The app calculates a **Reliability Score** for each employee based on how often they finish work on time. It has **automatic due-date alerts** that notify both the manager and employee when a task is overdue. I used **React** for the frontend, **Supabase** for the backend and authentication, **Redux** for state management, and **Tailwind CSS** for styling. The entire app has **Row Level Security** so employees can only see their own tasks, and managers can only see tasks they created. Instead of deleting tasks, I implemented a **soft archive system** to preserve data integrity and keep the reliability score accurate."

---

*Written for interview preparation — February 2026*
