import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Optional MongoDB connection (only if MONGO_URI is explicitly provided in environment)
const MONGO_URI = process.env.MONGO_URI || '';
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch((err) => console.warn('⚠️ MongoDB connection failed, using local JSON store fallback:', err.message));
}

// Helper functions for JSON persistence
function readJsonFile(filename, defaultData = []) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filename, data) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
  }
}

function createToken(user) {
  return `fd-token::${user.id}::${user.role || 'detective'}`;
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return {
    ...rest,
    username: rest.username || rest.name,
    role: rest.role || 'detective',
  };
}

// RBAC Authentication Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const users = readJsonFile('users.json', []);

  let userId = null;
  if (token.startsWith('fd-token::')) {
    const parts = token.split('::');
    userId = parts[1];
  } else if (token.startsWith('jwt-token-')) {
    userId = token.replace('jwt-token-', '');
  }

  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  req.user = sanitizeUser(user);
  next();
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')} (your role: ${req.user.role})`,
      });
    }
    next();
  };
}

// ==========================================
// 1. AUTHENTICATION & PROFILE ROUTES
// ==========================================

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, uid, branch, email, contact, password, avatar, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const users = readJsonFile('users.json', []);
    const existing = users.find(
      (u) =>
        (uid && u.uid && u.uid.toLowerCase() === uid.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (existing) {
      return res.json({
        token: createToken(existing),
        user: sanitizeUser(existing),
      });
    }

    const assignedRole = ['detective', 'architect', 'admin'].includes(role) ? role : 'detective';
    const badgeMap = {
      detective: 'Field Detective',
      architect: 'Case Architect',
      admin: 'Chief Inspector',
    };

    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      username: name,
      uid: uid || `FD-${Math.floor(1000 + Math.random() * 9000)}`,
      branch: branch || 'Frontend Engineering',
      email,
      contact: contact || 'N/A',
      password: password || 'password123',
      role: assignedRole,
      avatar: avatar || '🕵️‍♂️',
      badge: badgeMap[assignedRole],
      totalXp: 0,
      gamesPlayed: 0,
      victories: 0,
    };

    users.push(newUser);
    writeJsonFile('users.json', users);

    return res.status(201).json({
      token: createToken(newUser),
      user: sanitizeUser(newUser),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email, username, or UID is required' });
    }

    const users = readJsonFile('users.json', []);
    const norm = identifier.trim().toLowerCase();
    const user = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === norm) ||
        (u.username && u.username.toLowerCase() === norm) ||
        (u.name && u.name.toLowerCase() === norm) ||
        (u.uid && u.uid.toLowerCase() === norm)
    );

    if (!user) {
      return res.status(404).json({ error: 'No agent found with that identifier' });
    }

    if (password && user.password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.json({
      token: createToken(user),
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

app.patch('/api/auth/profile', authenticate, (req, res) => {
  try {
    const { name, avatar, branch, contact } = req.body;
    const users = readJsonFile('users.json', []);
    const idx = users.findIndex((u) => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    if (name) {
      users[idx].name = name;
      users[idx].username = name;
    }
    if (avatar) users[idx].avatar = avatar;
    if (branch) users[idx].branch = branch;
    if (contact) users[idx].contact = contact;

    writeJsonFile('users.json', users);
    return res.json({ user: sanitizeUser(users[idx]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==========================================
// 2. RBAC USER MANAGEMENT CRUD (ADMIN ONLY)
// ==========================================

app.get('/api/users', authenticate, authorizeRoles('admin'), (req, res) => {
  const users = readJsonFile('users.json', []);
  res.json(users.map(sanitizeUser));
});

app.patch('/api/users/:id', authenticate, authorizeRoles('admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { role, badge, totalXp } = req.body;
    const users = readJsonFile('users.json', []);
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });

    if (role && ['detective', 'architect', 'admin'].includes(role)) {
      users[idx].role = role;
    }
    if (badge !== undefined) {
      users[idx].badge = badge;
    }
    if (totalXp !== undefined) {
      users[idx].totalXp = Number(totalXp);
    }

    writeJsonFile('users.json', users);
    res.json({ user: sanitizeUser(users[idx]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticate, authorizeRoles('admin'), (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own active admin account' });
    }
    const users = readJsonFile('users.json', []);
    const target = users.find((u) => u.id === id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const updatedUsers = users.filter((u) => u.id !== id);
    writeJsonFile('users.json', updatedUsers);

    // Cascade delete user scores
    const scores = readJsonFile('leaderboard.json', []);
    const updatedScores = scores.filter(
      (s) => s.userId !== id && s.username.toLowerCase() !== (target.username || target.name).toLowerCase()
    );
    writeJsonFile('leaderboard.json', updatedScores);

    res.json({ message: 'User and associated scores deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// 3. CASES & ANOMALIES CRUD (ARCHITECT / ADMIN)
// ==========================================

app.get('/api/cases', (req, res) => {
  const cases = readJsonFile('cases.json', []);
  res.json(cases);
});

app.post('/api/cases', authenticate, authorizeRoles('architect', 'admin'), (req, res) => {
  try {
    const { title, difficulty, layoutType, roleTitle, timeLimit, attemptsLimit, errors } = req.body;
    if (!title || !difficulty) {
      return res.status(400).json({ error: 'Title and difficulty are required' });
    }

    const cases = readJsonFile('cases.json', []);
    const newCase = {
      id: `case-${Date.now()}`,
      title,
      difficulty,
      layoutType: layoutType || 'SaaS',
      roleTitle: roleTitle || `${difficulty} Specialist`,
      timeLimit: Number(timeLimit) || 45,
      attemptsLimit: Number(attemptsLimit) || 10,
      author: req.user.username,
      isOfficial: req.user.role === 'admin',
      errors: Array.isArray(errors) && errors.length > 0 ? errors : [
        {
          id: `err-${Date.now()}-1`,
          description: 'Uneven button padding',
          category: 'Spacing',
          points: 150,
          errorClass: 'px-2 py-4',
          fixedClass: 'px-6 py-3',
          explanation: 'Horizontal padding was smaller than vertical padding.'
        }
      ],
      notes: [],
    };

    cases.push(newCase);
    writeJsonFile('cases.json', cases);
    res.status(201).json(newCase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

app.put('/api/cases/:id', authenticate, authorizeRoles('architect', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { title, difficulty, layoutType, roleTitle, timeLimit, attemptsLimit, errors, isOfficial } = req.body;
    const cases = readJsonFile('cases.json', []);
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Case not found' });

    if (title !== undefined) cases[idx].title = title;
    if (difficulty !== undefined) cases[idx].difficulty = difficulty;
    if (layoutType !== undefined) cases[idx].layoutType = layoutType;
    if (roleTitle !== undefined) cases[idx].roleTitle = roleTitle;
    if (timeLimit !== undefined) cases[idx].timeLimit = Number(timeLimit);
    if (attemptsLimit !== undefined) cases[idx].attemptsLimit = Number(attemptsLimit);
    if (Array.isArray(errors)) cases[idx].errors = errors;
    if (isOfficial !== undefined && req.user.role === 'admin') {
      cases[idx].isOfficial = Boolean(isOfficial);
    }

    writeJsonFile('cases.json', cases);
    res.json(cases[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

app.delete('/api/cases/:id', authenticate, authorizeRoles('architect', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const cases = readJsonFile('cases.json', []);
    const target = cases.find((c) => c.id === id);
    if (!target) return res.status(404).json({ error: 'Case not found' });

    if (target.isOfficial && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only Chief Inspectors (Admins) can delete official cases' });
    }

    const updated = cases.filter((c) => c.id !== id);
    writeJsonFile('cases.json', updated);
    res.json({ message: 'Case deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// Post-Mortem Notes CRUD on a Case
app.post('/api/cases/:id/notes', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const cases = readJsonFile('cases.json', []);
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Case not found' });

    const newNote = {
      id: `note-${Date.now()}`,
      author: req.user.username,
      role: req.user.role,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    cases[idx].notes = cases[idx].notes || [];
    cases[idx].notes.unshift(newNote);
    writeJsonFile('cases.json', cases);

    res.status(201).json(newNote);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

app.delete('/api/cases/:id/notes/:noteId', authenticate, (req, res) => {
  try {
    const { id, noteId } = req.params;
    const cases = readJsonFile('cases.json', []);
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Case not found' });

    const note = (cases[idx].notes || []).find((n) => n.id === noteId);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.author !== req.user.username && !['admin', 'architect'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    cases[idx].notes = (cases[idx].notes || []).filter((n) => n.id !== noteId);
    writeJsonFile('cases.json', cases);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ==========================================
// 4. LEADERBOARD & SCORES CRUD
// ==========================================

app.get('/api/leaderboard', (req, res) => {
  try {
    const { roomCode, difficulty } = req.query;
    let scores = readJsonFile('leaderboard.json', []);

    if (roomCode) {
      scores = scores.filter((s) => (s.roomCode || '').toUpperCase() === String(roomCode).toUpperCase());
    }
    if (difficulty && difficulty !== 'All') {
      scores = scores.filter((s) => s.difficulty.toLowerCase() === String(difficulty).toLowerCase());
    }

    scores.sort((a, b) => b.xp - a.xp || b.timeLeft - a.timeLeft);
    res.json(scores.slice(0, 100));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const { userId, username, avatar, xp, difficulty, caseId, caseTitle, timeLeft, roomCode } = req.body;
    if (!userId || !username || xp === undefined || !difficulty || timeLeft === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const scores = readJsonFile('leaderboard.json', []);
    const newEntry = {
      id: `lb-${Date.now()}`,
      userId,
      username,
      avatar: avatar || '🕵️‍♂️',
      xp: Number(xp),
      difficulty,
      caseId: caseId || `case-${difficulty.toLowerCase()}`,
      caseTitle: caseTitle || `${difficulty} Assignment`,
      timeLeft: Number(timeLeft),
      roomCode: roomCode || null,
      date: new Date().toISOString(),
    };

    scores.push(newEntry);
    writeJsonFile('leaderboard.json', scores);

    // Update user's aggregate XP and victories
    const users = readJsonFile('users.json', []);
    const uIdx = users.findIndex((u) => u.id === userId || u.username === username);
    if (uIdx !== -1) {
      users[uIdx].totalXp = (users[uIdx].totalXp || 0) + Number(xp);
      users[uIdx].gamesPlayed = (users[uIdx].gamesPlayed || 0) + 1;
      users[uIdx].victories = (users[uIdx].victories || 0) + 1;
      writeJsonFile('users.json', users);
    }

    res.status(201).json(newEntry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.delete('/api/leaderboard/:id', authenticate, authorizeRoles('admin', 'architect'), (req, res) => {
  try {
    const { id } = req.params;
    const scores = readJsonFile('leaderboard.json', []);
    const filtered = scores.filter((s) => s.id !== id);
    if (filtered.length === scores.length) {
      return res.status(404).json({ error: 'Score entry not found' });
    }
    writeJsonFile('leaderboard.json', filtered);
    res.json({ message: 'Leaderboard entry purged' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete score' });
  }
});

// ==========================================
// 5. LIVE EVENT ROOMS CRUD
// ==========================================

app.get('/api/rooms', (req, res) => {
  const rooms = readJsonFile('rooms.json', []);
  res.json(rooms);
});

app.get('/api/rooms/:code', (req, res) => {
  const rooms = readJsonFile('rooms.json', []);
  const room = rooms.find((r) => r.code.toUpperCase() === req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room code not found' });
  res.json(room);
});

app.post('/api/rooms', authenticate, authorizeRoles('architect', 'admin'), (req, res) => {
  try {
    const { name, difficulty, code } = req.body;
    if (!name) return res.status(400).json({ error: 'Room name is required' });

    const rooms = readJsonFile('rooms.json', []);
    const roomCode = (code || `FD-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    if (rooms.some((r) => r.code.toUpperCase() === roomCode)) {
      return res.status(400).json({ error: 'Room code already exists' });
    }

    const newRoom = {
      id: `room-${Date.now()}`,
      code: roomCode,
      name,
      hostName: req.user.username,
      difficulty: difficulty || 'All',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    rooms.unshift(newRoom);
    writeJsonFile('rooms.json', rooms);
    res.status(201).json(newRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

app.patch('/api/rooms/:id', authenticate, authorizeRoles('architect', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, name, difficulty } = req.body;
    const rooms = readJsonFile('rooms.json', []);
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Room not found' });

    if (isActive !== undefined) rooms[idx].isActive = Boolean(isActive);
    if (name !== undefined) rooms[idx].name = name;
    if (difficulty !== undefined) rooms[idx].difficulty = difficulty;

    writeJsonFile('rooms.json', rooms);
    res.json(rooms[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

app.delete('/api/rooms/:id', authenticate, authorizeRoles('architect', 'admin'), (req, res) => {
  try {
    const { id } = req.params;
    const rooms = readJsonFile('rooms.json', []);
    const updated = rooms.filter((r) => r.id !== id);
    writeJsonFile('rooms.json', updated);
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🕵️‍♂️ Frontend Detective Full-Stack Server running on http://localhost:${PORT}`);
  });
}

export default app;
