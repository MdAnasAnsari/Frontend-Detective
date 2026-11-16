# Frontend Detective — Full-Stack UI Bug Hunting Platform

An interactive full-stack platform where players inspect live DOM layouts, identify
CSS/UI anomalies, and resolve visual bugs across difficulty tiers — backed by
MongoDB, JWT authentication, and Role-Based Access Control.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, GSAP, Framer Motion |
| Backend | Node.js, Express 5 (REST API, 21 routes) |
| Database | MongoDB with Mongoose ODM (4 schemas) |
| Auth | JWT (signed, expiring) + bcrypt password hashing |
| Security | helmet, CORS allowlist, express-rate-limit, schema validation |
| Deployment | Vercel (static client + serverless API) |

## Architecture

```
src/                 React client — talks to the API only, no local data store
  store.ts           Zustand game + auth state
  App.tsx            Game shell, layouts, post-mortem
  AuthModal.tsx      Register / sign in / profile
  AdminStudioModal   Command Studio (cases, rooms, RBAC console, telemetry)
  LeaderboardModal   Rankings + moderation
  HostScreen.tsx     Live presenter view

server/
  index.js           Express app, all 21 routes, error handling
  db.js              Connection-cached Mongo client (serverless-safe)
  auth.js            JWT signing, authenticate + authorizeRoles middleware
  models/            User, Case, Score, Room Mongoose schemas
  seed.js            Loads server/data/*.json fixtures into MongoDB
  data/              Seed fixtures only — NOT a runtime data store

api/index.js         Vercel serverless entry point (re-exports the Express app)
```

## Data Models

**User** — `name`, `username`, `uid` (unique), `branch`, `email` (unique),
`contact`, `password` (bcrypt, `select: false`), `role`, `avatar`, `badge`,
`totalXp`, `gamesPlayed`, `victories`

**Case** — `title`, `difficulty`, `layoutType`, `roleTitle`, `timeLimit`,
`attemptsLimit`, `author`, `isOfficial`, embedded `errors[]` (the DOM
anomalies) and `notes[]` (post-mortem field notes)

**Score** — `userId` (ref → User), `username`, `avatar`, `xp`, `difficulty`,
`caseId`, `caseTitle`, `timeLeft`, `roomCode`, `date`

**Room** — `code` (unique), `name`, `hostName`, `difficulty`, `isActive`

## Role-Based Access Control

Roles are enforced by server-side middleware (`authenticate` → `authorizeRoles`).
The JWT carries only the user id; **the role is re-read from the database on every
request**, so a tampered token cannot escalate privileges and a demotion takes
effect immediately.

- **Detective** (`detective`) — play cases, join live rooms, read post-mortems, post and delete their own field notes
- **Case Architect** (`architect`) — all of the above, plus the Command Studio: create/edit/delete cases and anomalies, manage live rooms, launch the presenter view, moderate leaderboard runs
- **Chief Inspector** (`admin`) — full privileges, including the RBAC console to promote/demote roles, assign badges, and delete accounts

New registrations are always `detective`. Role is never accepted from the request
body; only an authenticated admin can promote via `PATCH /api/users/:id`.

## API Reference

| Method | Route | Access |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/register` | public (rate-limited) |
| POST | `/api/auth/login` | public (rate-limited) |
| GET | `/api/auth/me` | authenticated |
| PATCH | `/api/auth/profile` | authenticated |
| GET | `/api/users` | admin |
| PATCH | `/api/users/:id` | admin |
| DELETE | `/api/users/:id` | admin (cascades scores) |
| GET | `/api/cases` | public |
| POST | `/api/cases` | architect, admin |
| PUT | `/api/cases/:id` | architect, admin |
| DELETE | `/api/cases/:id` | architect, admin (official cases: admin only) |
| POST | `/api/cases/:id/notes` | authenticated |
| DELETE | `/api/cases/:id/notes/:noteId` | author, architect, admin |
| GET | `/api/leaderboard` | public (`?roomCode=`, `?difficulty=`) |
| POST | `/api/leaderboard` | authenticated — identity taken from the token |
| DELETE | `/api/leaderboard/:id` | architect, admin (reverses the player's XP) |
| GET | `/api/rooms` | public |
| GET | `/api/rooms/:code` | public |
| POST | `/api/rooms` | architect, admin |
| PATCH | `/api/rooms/:id` | architect, admin |
| DELETE | `/api/rooms/:id` | architect, admin |

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    Set MONGO_URI (MongoDB Atlas free tier works) and JWT_SECRET

# 3. Seed the database from the fixtures in server/data/
npm run seed            # or: npm run seed:reset  (wipes collections first)

# 4. Start the API (port 5000)
npm run server

# 5. In a second terminal, start the client (port 5173, proxies /api -> :5000)
npm run dev
```

Seeded demo accounts sign in with the passwords in `server/data/users.json`
(hashed by bcrypt on insert). Change them before any public deployment.

### Verifying the backend is live

```bash
curl http://localhost:5000/api/health
```

The client has **no offline fallback**: if the API or database is unreachable it
shows an error state rather than hardcoded data. Stopping the server is a valid
way to confirm the frontend really depends on the backend.

## Deployment (Vercel)

1. Push to GitHub and import the repo into Vercel.
2. Add `MONGO_URI`, `JWT_SECRET`, and `CORS_ORIGINS` as environment variables.
3. In MongoDB Atlas, allow access from `0.0.0.0/0` (Vercel's IPs are dynamic).
4. Deploy. `vercel.json` routes `/api/*` to the serverless function and
   everything else to the SPA.

`server/db.js` memoises the Mongo connection on `globalThis`, so warm serverless
invocations reuse one pool instead of exhausting the Atlas connection limit.

## Security Notes

- Passwords are hashed with bcrypt (12 rounds) and never returned by the API
- JWTs are signed and expire (`JWT_EXPIRES_IN`, default 7 days)
- Login returns one generic error for both unknown user and wrong password, so
  the endpoint cannot be used to enumerate accounts
- Score submission is authenticated and the player identity comes from the
  token, not the request body
- XP aggregates use atomic `$inc` rather than read-modify-write
- Rate limits: 20 auth attempts / 15 min, 60 writes / min
- No stack traces are returned to clients; all `/api` errors are JSON
