/**
 * Seeds MongoDB from the legacy JSON fixtures in server/data/.
 *
 *   npm run seed          # insert, skip anything already present
 *   npm run seed -- --reset   # wipe the four collections first
 *
 * Plaintext passwords in the fixtures are hashed on the way in by the
 * User model's pre-save hook.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectDB } from './db.js';
import User from './models/User.js';
import Case from './models/Case.js';
import Score from './models/Score.js';
import Room from './models/Room.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const RESET = process.argv.includes('--reset');

function loadFixture(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`  (no fixture ${name}.json, skipping)`);
    return [];
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

async function run() {
  await connectDB();

  if (RESET) {
    await Promise.all([
      User.deleteMany({}),
      Case.deleteMany({}),
      Score.deleteMany({}),
      Room.deleteMany({}),
    ]);
    console.log('🧹 Cleared users, cases, scores, rooms');
  }

  // ---- Users -------------------------------------------------------------
  // Saved one at a time (not insertMany) so the pre-save bcrypt hook runs.
  const userFixtures = loadFixture('users');
  const usersByName = new Map();
  let usersAdded = 0;

  for (const u of userFixtures) {
    const existing = await User.findOne({ email: String(u.email).toLowerCase() });
    if (existing) {
      usersByName.set(String(existing.username).toLowerCase(), existing._id);
      continue;
    }
    const doc = new User({
      name: u.name,
      username: u.username || u.name,
      uid: u.uid,
      branch: u.branch,
      email: u.email,
      contact: u.contact,
      password: u.password || 'changeme123',
      role: u.role || 'detective',
      avatar: u.avatar,
      badge: u.badge,
      totalXp: u.totalXp || 0,
      gamesPlayed: u.gamesPlayed || 0,
      victories: u.victories || 0,
    });
    await doc.save();
    usersByName.set(String(doc.username).toLowerCase(), doc._id);
    usersAdded += 1;
  }
  console.log(`👤 Users: ${usersAdded} inserted, ${userFixtures.length - usersAdded} already present`);

  // ---- Cases -------------------------------------------------------------
  const caseFixtures = loadFixture('cases');
  let casesAdded = 0;
  for (const c of caseFixtures) {
    if (await Case.findOne({ title: c.title })) continue;
    // The legacy string `id` is dropped; Mongo assigns the _id that toJSON
    // exposes back to the client as `id`.
    const { id: _legacyId, ...rest } = c;
    await Case.create({ ...rest, notes: rest.notes || [] });
    casesAdded += 1;
  }
  console.log(`🗂  Cases: ${casesAdded} inserted, ${caseFixtures.length - casesAdded} already present`);

  // ---- Rooms -------------------------------------------------------------
  const roomFixtures = loadFixture('rooms');
  let roomsAdded = 0;
  for (const r of roomFixtures) {
    if (await Room.findOne({ code: String(r.code).toUpperCase() })) continue;
    const { id: _legacyId, ...rest } = r;
    await Room.create(rest);
    roomsAdded += 1;
  }
  console.log(`🚪 Rooms: ${roomsAdded} inserted, ${roomFixtures.length - roomsAdded} already present`);

  // ---- Scores ------------------------------------------------------------
  // Legacy rows carry no userId, so they are matched back to a seeded user by
  // username. Anything unmatched is reported and skipped rather than invented:
  // every score now belongs to a real account.
  const scoreFixtures = loadFixture('leaderboard');
  let scoresAdded = 0;
  const orphaned = [];

  for (const s of scoreFixtures) {
    const ownerId = usersByName.get(String(s.username || '').toLowerCase());
    if (!ownerId) {
      orphaned.push(s.username);
      continue;
    }
    const dup = await Score.findOne({ userId: ownerId, xp: s.xp, date: s.date });
    if (dup) continue;
    await Score.create({
      userId: ownerId,
      username: s.username,
      avatar: s.avatar,
      xp: s.xp,
      difficulty: s.difficulty || 'Unranked',
      caseId: s.caseId || null,
      caseTitle: s.caseTitle || 'Field Assignment',
      timeLeft: s.timeLeft ?? 0,
      roomCode: s.roomCode || null,
      date: s.date,
    });
    scoresAdded += 1;
  }
  console.log(`🏆 Scores: ${scoresAdded} inserted`);
  if (orphaned.length) {
    console.log(`   skipped ${orphaned.length} with no matching account: ${[...new Set(orphaned)].join(', ')}`);
  }

  await mongoose.disconnect();
  console.log('\n✅ Seed complete.');
}

run().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
