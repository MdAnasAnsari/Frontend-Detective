import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:Nexa%40soul123@cluster0.rh2fiub.mongodb.net/FrontendDetective?retryWrites=true&w=majority";

if (!MONGO_URI) {
  console.warn("⚠️ No MONGO_URI provided! The server will start, but database operations will fail. Please add a MongoDB connection string.");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
}

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uid: { type: String, required: true, unique: true },
  branch: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  avatar: { type: String, default: '🕵️' },
  badge: { type: String, default: 'Rookie Detective' },
  totalXp: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  victories: { type: Number, default: 0 }
});

const User = mongoose.model('User', userSchema);

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, uid, branch, email, contact, avatar } = req.body;
    if (!name || !uid || !branch || !email || !contact) {
      return res.status(400).json({ error: 'All fields (name, uid, branch, email, contact) are required' });
    }

    const existingUser = await User.findOne({ uid: new RegExp('^' + uid + '$', 'i') });
    if (existingUser) {
      // If user already exists with this UID, just log them in (seamless experience)
      return res.json({ token: `jwt-token-${existingUser._id}`, user: { id: existingUser._id, ...existingUser.toObject(), username: existingUser.name } });
    }

    const newUser = new User({ name, uid, branch, email, contact, avatar });
    await newUser.save();

    const userObj = newUser.toObject();
    
    // Send back username as name so the frontend doesn't break
    return res.json({ token: `jwt-token-${userObj._id}`, user: { id: userObj._id, ...userObj, username: userObj.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});


app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const userId = authHeader.replace('Bearer jwt-token-', '');
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const userObj = user.toObject();
    delete userObj.password;
    
    return res.json({ user: { id: userObj._id, ...userObj } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
