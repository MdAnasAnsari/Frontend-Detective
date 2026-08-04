import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed files
if (!fs.existsSync(USERS_FILE)) {
  const initialUsers = [
    {
      id: 'usr-1',
      username: 'GarvitBhutani',
      email: 'garvit@nexasoul.com',
      password: 'password123',
      avatar: '🕵️‍♂️',
      badge: 'Chief Detective',
      totalXp: 4800,
      gamesPlayed: 12,
      victories: 11
    },
    {
      id: 'usr-2',
      username: 'CyberNinja',
      email: 'ninja@cyber.io',
      password: 'password123',
      avatar: '🥷',
      badge: 'Senior Bug Hunter',
      totalXp: 3650,
      gamesPlayed: 10,
      victories: 8
    },
    {
      id: 'usr-3',
      username: 'CodeSherlock',
      email: 'sherlock@holmes.dev',
      password: 'password123',
      avatar: '🔎',
      badge: 'Master Sleuth',
      totalXp: 2900,
      gamesPlayed: 7,
      victories: 6
    }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
}

if (!fs.existsSync(LEADERBOARD_FILE)) {
  const initialLeaderboard = [
    { id: 'lb-1', username: 'GarvitBhutani', avatar: '🕵️‍♂️', xp: 1250, difficulty: 'Nightmare', timeLeft: 8, date: new Date().toISOString() },
    { id: 'lb-2', username: 'CyberNinja', avatar: '🥷', xp: 950, difficulty: 'Hard', timeLeft: 12, date: new Date().toISOString() },
    { id: 'lb-3', username: 'CodeSherlock', avatar: '🔎', xp: 750, difficulty: 'Medium', timeLeft: 22, date: new Date().toISOString() },
    { id: 'lb-4', username: 'DemoMaster', avatar: '⚡', xp: 600, difficulty: 'Demo', timeLeft: 45, date: new Date().toISOString() },
    { id: 'lb-5', username: 'PixelRookie', avatar: '👾', xp: 450, difficulty: 'Demo', timeLeft: 30, date: new Date().toISOString() },
  ];
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(initialLeaderboard, null, 2));
}

// Helpers
const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const saveUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const getLeaderboard = () => JSON.parse(fs.readFileSync(LEADERBOARD_FILE, 'utf8'));
const saveLeaderboard = (lb) => fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(lb, null, 2));

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, avatar } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Account with this email already exists' });
  }
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    username,
    email,
    password,
    avatar: avatar || '🕵️',
    badge: 'Rookie Detective',
    totalXp: 0,
    gamesPlayed: 0,
    victories: 0
  };

  users.push(newUser);
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = newUser;
  return res.json({ token: `jwt-token-${newUser.id}`, user: userWithoutPassword });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please enter username/email and password' });
  }

  const users = getUsers();
  const user = users.find(
    u => (u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()) && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please check your email/username and password.' });
  }

  const { password: _, ...userWithoutPassword } = user;
  return res.json({ token: `jwt-token-${user.id}`, user: userWithoutPassword });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const userId = authHeader.replace('Bearer jwt-token-', '');
  const users = getUsers();
  const user = users.find(u => u.id === userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { password: _, ...userWithoutPassword } = user;
  return res.json({ user: userWithoutPassword });
});

// Leaderboard Routes
app.get('/api/leaderboard', (req, res) => {
  const leaderboard = getLeaderboard();
  // Sort descending by xp
  leaderboard.sort((a, b) => b.xp - a.xp);
  return res.json(leaderboard);
});

app.post('/api/leaderboard', (req, res) => {
  const { username, avatar, xp, difficulty, timeLeft, userId } = req.body;
  if (!username || xp === undefined) {
    return res.status(400).json({ error: 'Missing entry details' });
  }

  const leaderboard = getLeaderboard();
  const newEntry = {
    id: `lb-${Date.now()}`,
    username,
    avatar: avatar || '🕵️',
    xp,
    difficulty: difficulty || 'Demo',
    timeLeft: timeLeft || 0,
    date: new Date().toISOString()
  };

  leaderboard.push(newEntry);
  leaderboard.sort((a, b) => b.xp - a.xp);

  // Keep top 50 entries
  const trimmed = leaderboard.slice(0, 50);
  saveLeaderboard(trimmed);

  // Also update user's totalXp and stats if userId is provided
  if (userId) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      users[userIndex].totalXp += xp;
      users[userIndex].gamesPlayed += 1;
      users[userIndex].victories += 1;

      // Update badge based on total XP
      if (users[userIndex].totalXp >= 4000) users[userIndex].badge = 'Chief Detective';
      else if (users[userIndex].totalXp >= 2500) users[userIndex].badge = 'Senior Bug Hunter';
      else if (users[userIndex].totalXp >= 1000) users[userIndex].badge = 'Inspector';
      else users[userIndex].badge = 'Rookie Detective';

      saveUsers(users);
    }
  }

  return res.json({ success: true, leaderboard: trimmed });
});

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
