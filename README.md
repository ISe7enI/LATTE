
# LATTE Fullstack (Frontend + Supabase Backend)

This project now includes:

- `Vite + React` frontend
- `Node + Express` backend (`server/index.ts`)
- `Supabase` as persistent storage

## 1) Install

```bash
npm install
```

## 2) Configure environment

Copy `.env.example` to `.env` and fill in your Supabase values:

```env
PORT=8787
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_API_BASE_URL=http://localhost:8787/api
```

## 3) Create database tables in Supabase

Run SQL from:

- `supabase/schema.sql`

in Supabase SQL Editor.

## 4) Run backend + frontend

Terminal A:

```bash
npm run dev:backend
```

Terminal B:

```bash
npm run dev
```

Frontend will request backend APIs under `/api/*`, and backend reads/writes Supabase tables.

## 5) Auth headers (role + user isolation)

Backend endpoints now enforce lightweight auth headers:

- `x-user-id`
- `x-user-role` (`user` | `coach`)

Current frontend `http` service attaches these automatically:

- `/api/coach/*` => `coach` role
- other `/api/*` => `user` role with current user id

## 6) Enable Supabase RLS (recommended for production)

Run:

- `supabase/rls.sql`

This enables row-level policies for user tables (`workouts`, `user_profiles`, `user_preferences`, `user_training_plans`) so users can only access their own rows when using Supabase Auth directly.

## 7) Basic backend auth tests

```bash
npm run test:backend-auth
```

## 8) Production checklist

- replace hardcoded app user/session with Supabase Auth login flow
- keep using backend service role only on trusted server side
- configure separate `dev` / `prod` Supabase projects and env vars
- deploy backend and frontend with HTTPS and CORS allowlist
  