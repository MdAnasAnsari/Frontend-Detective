# Frontend Detective — Full-Stack RBAC & UI Bug Hunting Platform

An interactive full-stack web engineering platform where players inspect live DOM layouts, identify CSS/UI anomalies, and resolve visual bugs across multiple difficulty tiers — powered by Role-Based Access Control (RBAC) and full CRUD management.

## Key Full-Stack Features

### 1. Role-Based Access Control (RBAC)
Three distinct roles with server-side middleware enforcement (`authenticate` & `authorizeRoles`):
- **Detective (`detective`)**: Play official and community Cases, link to Live Event Rooms, inspect Post-Mortem technical explanations, and post/delete Field Notes.
- **Case Architect (`architect`)**: Everything a Detective can do, plus access to the **Command Studio** to create, edit, and delete custom Cases & DOM anomalies, manage Live Event Rooms, launch the **Live Host Presenter View**, and moderate Leaderboard runs.
- **Chief Inspector (`admin`)**: Full platform privileges, including the **User RBAC Console** to promote/demote user roles, assign custom badges, and delete user accounts.

### 2. Full CRUD Modules
- **Cases & Anomaly Builder CRUD (`/api/cases`)**: Create custom levels, choose layout templates (`SaaS`, `Ecommerce`, `Analytics`, `Settings`), configure time/integrity limits, and customize broken (`errorClass`) vs. fixed (`fixedClass`) Tailwind classes.
- **User & Profile CRUD (`/api/auth`, `/api/users`)**: Register, Sign In, 1-Click RBAC Demo Role switching, in-place profile editing, and Admin User role/badge management.
- **Leaderboard & Moderation CRUD (`/api/leaderboard`)**: Record verified mission runs and purge invalid entries (`admin` / `architect`).
- **Live Hackathon / Classroom Rooms CRUD (`/api/rooms`)**: Create event rooms with join codes (`FD-2026`), toggle active status, filter leaderboards by room code, and display QR codes in Presenter Mode.
- **Post-Mortem Field Notes CRUD (`/api/cases/:id/notes`)**: Inspect broken vs. fixed CSS classes after a mission and contribute debugging notes.

## Running Locally

```bash
# 1. Start the Express Full-Stack API Server (Port 5000)
npm run server

# 2. In a second terminal, start the Vite Frontend (Port 5173, proxies /api -> localhost:5000)
npm run dev
```
