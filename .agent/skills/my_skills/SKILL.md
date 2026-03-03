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
- React 18 + Vite
- Tailwind CSS v4
- Redux Toolkit
- Supabase (Authentication + Database)

## 🔹 ARCHITECTURE SKILL

- Use feature-based folder structure.
- Use functional components only.
- Use React hooks only.
- Separate UI, state management, and API logic.
- Keep business logic outside JSX.
- Create reusable components.
- Follow scalable SaaS architecture.

Folder Structure:

```
src/
  features/
    auth/
    dashboard/
    tasks/
  components/
  layout/
  store/
  services/
  hooks/
  utils/
```

## 🔹 UI & STYLING RULES

- Use Tailwind CSS v4 only.
- No inline styles.
- No CSS modules.
- No mixed styling systems.
- Create reusable UI components (Button, Input, Card, Modal, Badge).
- Maintain responsive design.
- Prepare structure for dark mode.

## 🔹 STATE MANAGEMENT RULES

- Use Redux Toolkit.
- Use `createSlice`.
- Use `asyncThunk` for API calls.
- Keep slices inside feature folders.
- Do not store unnecessary global state.
- Keep Redux logic separate from components.

## 🔹 SUPABASE RULES

- Use Supabase for authentication.
- Use Supabase for database operations.
- Never hardcode API keys.
- Always use environment variables (`.env`).
- Create a services layer for Supabase calls.
- Implement role-based access control.
- Prepare system for Row Level Security (RLS).

## 🔹 SECURITY RULES

- Do not expose `service_role` keys.
- Validate user roles before rendering protected pages.
- Use ProtectedRoute components.
- Redirect unauthenticated users to login.

## 🔹 CODE QUALITY RULES

- Use modern ES syntax.
- Write clean, readable, modular code.
- Avoid unnecessary files.
- Keep files under reasonable size.
- Use meaningful naming conventions.
- Avoid `console.log` in production code.

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
