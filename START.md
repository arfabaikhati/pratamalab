# PratamaLab — Start Guide

## Prerequisites
- Laragon running (MySQL + Apache/Nginx)
- Node.js v22+

## 1. Start Laravel Backend

Open terminal in `backend/` folder:

```bash
# Set PHP in PATH (or use Laragon's built-in terminal)
php artisan serve --port=8000
```

In a separate terminal (for real-time WebSocket):
```bash
php artisan reverb:start
```

In a third terminal (for queued jobs):
```bash
php artisan queue:work
```

## 2. Start Next.js Frontend

Open terminal in `frontend/` folder:

```bash
npm run dev
```

Open **http://localhost:3000**

## Demo Login
- Email: `demo@pratamalab.com`
- Password: `password`

## Features
- ✅ Block-based editor (like Notion) — Heading, List, Table, Code, Quote, Callout, etc.
- ✅ Workspace & page management with nested pages
- ✅ Real-time collaboration (multiple users see each other's cursor + live updates)
- ✅ Sidebar with page tree, favorites, trash
- ✅ Members management with role-based access (owner/admin/editor/viewer)
- ✅ Page locking, favorites, archiving
- ✅ Auto-save every 1.5 seconds

## Architecture
```
frontend/  (Next.js 14 + TypeScript + Tailwind)
  app/
    (auth)/login        — Login page
    (auth)/register     — Register page  
    (app)/workspace/
      [workspaceId]/
        page.tsx        — Workspace home (recent pages grid)
        members/        — Members management
        page/[pageId]/  — Block editor page

backend/   (Laravel 11 + Sanctum + Reverb)
  app/
    Http/Controllers/Api/
      AuthController      — Register, Login, Me
      WorkspaceController — CRUD + members
      PageController      — CRUD + tree + reorder
      BlockController     — CRUD + bulk save
    Events/
      PageUpdated         — Broadcast on page update
      BlocksUpdated       — Broadcast on block changes
      UserPresence        — Join/leave page channel
  routes/
    api.php      — 26 REST API endpoints
    channels.php — Reverb presence channels
```
