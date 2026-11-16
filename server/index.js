import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { connectDB, requireDB, isDbConfigured } from './db.js';
import { authenticate, authorizeRoles, createToken } from './auth.js';
import User, { USER_ROLES } from './models/User.js';
import Case from './models/Case.js';
import Score from './models/Score.js';
import Room from './models/Room.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet());

// CORS: locked to the configured origins. The Vite dev server is proxied, so
// same-origin in development; CORS_ORIGINS matters for a split deployment.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = same-origin, curl, or a server-to-server call.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '200kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

// Health check is registered BEFORE the DB guard so it still answers when
// Mongo is unreachable -- that is exactly when you need to query it.
app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  res.json({
    status: state === 'connected' ? 'ok' : 'degraded',
    database: { configured: isDbConfigured(), state },
  });
});

// Every data route goes through requireDB, which returns 503 if Mongo is
// unreachable rather than pretending a write succeeded.
app.use('/api', requireDB);

const BADGE_BY_ROLE = {
  detective: 'Field Detective',
  architect: 'Case Architect',
  admin: 'Chief Inspector',
};

// Wraps an async handler so a rejected promise reaches the error middleware
// instead of hanging the request.
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

app.post(
  '/api/auth/register',
  authLimiter,
  ah(async (req, res) => {
    const { name, uid, branch, email, contact, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const resolvedUid = uid || `FD-${Math.floor(1000 + Math.random() * 9000)}`;
    const clash = await User.findOne({
      $or: [{ email: String(email).toLowerCase() }, { uid: resolvedUid }],
    });
    if (clash) {
      return res
        .status(409)
        .json({ error: 'An agent with this email or UID already exists. Please sign in.' });
    }

    // Role is never taken from the request body. Every recruit starts as a
    // detective; only an authenticated admin can promote via /api/users/:id.
    const user = new User({
      name,
      username: name,
      uid: resolvedUid,
      branch: branch || 'Frontend Engineering',
      email,
      contact: contact || 'N/A',
      password,
      role: 'detective',
      avatar: avatar || '🕵️‍♂️',
      badge: BADGE_BY_ROLE.detective,
    });
    await user.save();

    res.status(201).json({ token: createToken(user), user: user.toJSON() });
  })
);

app.post(
  '/api/auth/login',
  authLimiter,
  ah(async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const norm = String(identifier).trim();
    const user = await User.findOne({
      $or: [
        { email: norm.toLowerCase() },
        { username: new RegExp(`^${escapeRegex(norm)}$`, 'i') },
        { name: new RegExp(`^${escapeRegex(norm)}$`, 'i') },
        { uid: new RegExp(`^${escapeRegex(norm)}$`, 'i') },
      ],
    }).select('+password');

    // One generic message for both "no such user" and "wrong password" so the
    // endpoint cannot be used to enumerate which accounts exist.
    const invalid = { error: 'Invalid credentials. Please check your details and try again.' };
    if (!user) return res.status(401).json(invalid);

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json(invalid);

    res.json({ token: createToken(user), user: user.toJSON() });
  })
);

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user.toJSON() });
});

app.patch(
  '/api/auth/profile',
  authenticate,
  writeLimiter,
  ah(async (req, res) => {
    const { name, avatar, branch, contact } = req.body;
    const user = req.user;

    if (name) {
      user.name = name;
      user.username = name;
    }
    if (avatar) user.avatar = avatar;
    if (branch) user.branch = branch;
    if (contact) user.contact = contact;

    await user.save();
    res.json({ user: user.toJSON() });
  })
);

// ==========================================
// 2. RBAC USER MANAGEMENT (ADMIN ONLY)
// ==========================================

app.get(
  '/api/users',
  authenticate,
  authorizeRoles('admin'),
  ah(async (req, res) => {
    const users = await User.find().sort({ totalXp: -1 });
    res.json(users.map((u) => u.toJSON()));
  })
);

app.patch(
  '/api/users/:id',
  authenticate,
  authorizeRoles('admin'),
  writeLimiter,
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const { role, badge, totalXp } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // An admin must not strip their own admin role and lock everyone out.
    if (role && role !== user.role && String(user._id) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }
    if (role) {
      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ error: `Role must be one of: ${USER_ROLES.join(', ')}` });
      }
      user.role = role;
      if (badge === undefined) user.badge = BADGE_BY_ROLE[role];
    }
    if (badge !== undefined) user.badge = badge;
    if (totalXp !== undefined) {
      const xp = Number(totalXp);
      if (!Number.isFinite(xp) || xp < 0) {
        return res.status(400).json({ error: 'totalXp must be a non-negative number' });
      }
      user.totalXp = xp;
    }

    await user.save();
    res.json({ user: user.toJSON() });
  })
);

app.delete(
  '/api/users/:id',
  authenticate,
  authorizeRoles('admin'),
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ error: 'Cannot delete your own active admin account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await Score.deleteMany({ userId: user._id });
    await user.deleteOne();

    res.json({ message: 'User and associated scores deleted' });
  })
);

// ==========================================
// 3. CASES & ANOMALIES CRUD
// ==========================================

app.get(
  '/api/cases',
  ah(async (req, res) => {
    const cases = await Case.find().sort({ createdAt: 1 });
    res.json(cases.map((c) => c.toJSON()));
  })
);

app.post(
  '/api/cases',
  authenticate,
  authorizeRoles('architect', 'admin'),
  writeLimiter,
  ah(async (req, res) => {
    const { title, difficulty, layoutType, roleTitle, timeLimit, attemptsLimit, errors } = req.body;
    if (!title || !difficulty) {
      return res.status(400).json({ error: 'Title and difficulty are required' });
    }

    const stamp = Date.now();
    const created = await Case.create({
      title,
      difficulty,
      layoutType: layoutType || 'SaaS',
      roleTitle: roleTitle || `${difficulty} Specialist`,
      timeLimit: Number(timeLimit) || 45,
      attemptsLimit: Number(attemptsLimit) || 10,
      author: req.user.username,
      isOfficial: req.user.role === 'admin',
      errors:
        Array.isArray(errors) && errors.length > 0
          ? errors.map((e, i) => ({ ...e, id: e.id || `err-${stamp}-${i + 1}` }))
          : [
              {
                id: `err-${stamp}-1`,
                description: 'Uneven button padding',
                category: 'Spacing',
                points: 150,
                errorClass: 'px-2 py-4',
                fixedClass: 'px-6 py-3',
                explanation: 'Horizontal padding was smaller than vertical padding.',
              },
            ],
      notes: [],
    });

    res.status(201).json(created.toJSON());
  })
);

app.put(
  '/api/cases/:id',
  authenticate,
  authorizeRoles('architect', 'admin'),
  writeLimiter,
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid case id' });
    }

    const found = await Case.findById(req.params.id);
    if (!found) return res.status(404).json({ error: 'Case not found' });

    const { title, difficulty, layoutType, roleTitle, timeLimit, attemptsLimit, errors, isOfficial } =
      req.body;

    if (title !== undefined) found.title = title;
    if (difficulty !== undefined) found.difficulty = difficulty;
    if (layoutType !== undefined) found.layoutType = layoutType;
    if (roleTitle !== undefined) found.roleTitle = roleTitle;
    if (timeLimit !== undefined) found.timeLimit = Number(timeLimit);
    if (attemptsLimit !== undefined) found.attemptsLimit = Number(attemptsLimit);
    if (Array.isArray(errors)) {
      const stamp = Date.now();
      found.errors = errors.map((e, i) => ({ ...e, id: e.id || `err-${stamp}-${i + 1}` }));
    }
    if (isOfficial !== undefined && req.user.role === 'admin') {
      found.isOfficial = Boolean(isOfficial);
    }

    await found.save();
    res.json(found.toJSON());
  })
);

app.delete(
  '/api/cases/:id',
  authenticate,
  authorizeRoles('architect', 'admin'),
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid case id' });
    }

    const found = await Case.findById(req.params.id);
    if (!found) return res.status(404).json({ error: 'Case not found' });

    if (found.isOfficial && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Chief Inspectors (Admins) can delete official cases' });
    }

    await found.deleteOne();
    res.json({ message: 'Case deleted successfully' });
  })
);

// Post-Mortem Field Notes
app.post(
  '/api/cases/:id/notes',
  authenticate,
  writeLimiter,
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid case id' });
    }

    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const found = await Case.findById(req.params.id);
    if (!found) return res.status(404).json({ error: 'Case not found' });

    const note = {
      id: `note-${Date.now()}`,
      author: req.user.username,
      role: req.user.role,
      content: String(content).trim().slice(0, 2000),
      createdAt: new Date().toISOString(),
    };

    found.notes.unshift(note);
    await found.save();

    res.status(201).json(note);
  })
);

app.delete(
  '/api/cases/:id/notes/:noteId',
  authenticate,
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid case id' });
    }

    const found = await Case.findById(req.params.id);
    if (!found) return res.status(404).json({ error: 'Case not found' });

    const note = found.notes.find((n) => n.id === req.params.noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.author !== req.user.username && !['admin', 'architect'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    found.notes = found.notes.filter((n) => n.id !== req.params.noteId);
    await found.save();

    res.json({ message: 'Note deleted' });
  })
);

// ==========================================
// 4. LEADERBOARD & SCORES
// ==========================================

app.get(
  '/api/leaderboard',
  ah(async (req, res) => {
    const { roomCode, difficulty } = req.query;
    const query = {};

    if (roomCode) query.roomCode = String(roomCode).toUpperCase();
    if (difficulty && difficulty !== 'All') {
      // Anchored case-insensitive match. Previously this called
      // .toLowerCase() on every row and threw a 500 if any row was missing
      // the field; difficulty is now required by the schema as well.
      query.difficulty = new RegExp(`^${escapeRegex(String(difficulty))}$`, 'i');
    }

    const scores = await Score.find(query).sort({ xp: -1, timeLeft: -1 }).limit(100);
    res.json(scores.map((s) => s.toJSON()));
  })
);

/**
 * Submitting a run now requires a valid session, and the identity is taken
 * from the token rather than the request body. Previously this route was
 * unauthenticated, so anyone could POST an arbitrary username with arbitrary
 * XP and inflate that player's lifetime total.
 */
app.post(
  '/api/leaderboard',
  authenticate,
  writeLimiter,
  ah(async (req, res) => {
    const { xp, difficulty, caseId, caseTitle, timeLeft, roomCode } = req.body;

    if (xp === undefined || !difficulty || timeLeft === undefined) {
      return res.status(400).json({ error: 'xp, difficulty and timeLeft are required' });
    }

    const xpNum = Number(xp);
    const timeNum = Number(timeLeft);
    if (!Number.isFinite(xpNum) || xpNum < 0 || xpNum > 100000) {
      return res.status(400).json({ error: 'xp must be a number between 0 and 100000' });
    }
    if (!Number.isFinite(timeNum) || timeNum < 0) {
      return res.status(400).json({ error: 'timeLeft must be a non-negative number' });
    }

    const entry = await Score.create({
      userId: req.user._id,
      username: req.user.username,
      avatar: req.user.avatar,
      xp: xpNum,
      difficulty,
      caseId: caseId || null,
      caseTitle: caseTitle || `${difficulty} Assignment`,
      timeLeft: timeNum,
      roomCode: roomCode || null,
      date: new Date().toISOString(),
    });

    // Atomic increment: $inc avoids the read-modify-write race the old
    // JSON store had, where two runs finishing together lost one update.
    await User.updateOne(
      { _id: req.user._id },
      { $inc: { totalXp: xpNum, gamesPlayed: 1, victories: 1 } }
    );

    res.status(201).json(entry.toJSON());
  })
);

app.delete(
  '/api/leaderboard/:id',
  authenticate,
  authorizeRoles('admin', 'architect'),
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid score id' });
    }

    const score = await Score.findById(req.params.id);
    if (!score) return res.status(404).json({ error: 'Score entry not found' });

    // Roll the player's aggregate back so moderation stays consistent.
    await User.updateOne(
      { _id: score.userId },
      { $inc: { totalXp: -score.xp, gamesPlayed: -1, victories: -1 } }
    );
    await score.deleteOne();

    res.json({ message: 'Leaderboard entry purged' });
  })
);

// ==========================================
// 5. LIVE EVENT ROOMS CRUD
// ==========================================

app.get(
  '/api/rooms',
  ah(async (req, res) => {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms.map((r) => r.toJSON()));
  })
);

app.get(
  '/api/rooms/:code',
  ah(async (req, res) => {
    const room = await Room.findOne({ code: String(req.params.code).toUpperCase() });
    if (!room) return res.status(404).json({ error: 'Room code not found' });
    res.json(room.toJSON());
  })
);

app.post(
  '/api/rooms',
  authenticate,
  authorizeRoles('architect', 'admin'),
  writeLimiter,
  ah(async (req, res) => {
    const { name, difficulty, code } = req.body;
    if (!name) return res.status(400).json({ error: 'Room name is required' });

    const roomCode = String(code || `FD-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    if (await Room.findOne({ code: roomCode })) {
      return res.status(409).json({ error: 'Room code already exists' });
    }

    const room = await Room.create({
      code: roomCode,
      name,
      hostName: req.user.username,
      difficulty: difficulty || 'All',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(room.toJSON());
  })
);

app.patch(
  '/api/rooms/:id',
  authenticate,
  authorizeRoles('architect', 'admin'),
  writeLimiter,
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid room id' });
    }

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { isActive, name, difficulty } = req.body;
    if (isActive !== undefined) room.isActive = Boolean(isActive);
    if (name !== undefined) room.name = name;
    if (difficulty !== undefined) room.difficulty = difficulty;

    await room.save();
    res.json(room.toJSON());
  })
);

app.delete(
  '/api/rooms/:id',
  authenticate,
  authorizeRoles('architect', 'admin'),
  ah(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid room id' });
    }

    // Previously returned success even when nothing matched.
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  })
);

// ==========================================
// 404 + CENTRAL ERROR HANDLER
// ==========================================

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Unknown /api/* paths return JSON, not Express's default HTML error page.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` });
});

// Single error handler. Mongoose validation and duplicate-key errors are
// translated to 400/409, and stack traces never reach the client.
app.use((err, req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  if (err?.message?.includes('not allowed by CORS policy')) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map((e) => e.message),
    });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'A record with that unique value already exists' });
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (!process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🕵️‍♂️ Frontend Detective API running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ Could not start server:', err.message);
      process.exit(1);
    });
}

export default app;
