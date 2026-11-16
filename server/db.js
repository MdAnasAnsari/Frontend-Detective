import mongoose from 'mongoose';

/**
 * Serverless-safe MongoDB connection.
 *
 * On Vercel each invocation may reuse a warm container. Without caching we
 * would open a new connection pool per request and exhaust the Atlas
 * connection limit, so the promise is memoised on globalThis.
 */
const MONGO_URI = process.env.MONGO_URI || '';

let cached = globalThis.__fdMongoose;
if (!cached) {
  cached = globalThis.__fdMongoose = { conn: null, promise: null };
}

export function isDbConfigured() {
  return Boolean(MONGO_URI);
}

export async function connectDB() {
  if (!MONGO_URI) {
    throw new Error(
      'MONGO_URI is not set. Frontend Detective requires MongoDB. ' +
        'Copy .env.example to .env and point MONGO_URI at your Atlas cluster.'
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log('✅ MongoDB connected');
        return m;
      })
      .catch((err) => {
        // Reset so a later request can retry instead of reusing a dead promise.
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Express middleware: guarantees a live DB connection before any route that
 * touches data. Fails loudly with 503 instead of silently losing writes.
 */
export async function requireDB(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database unavailable:', err.message);
    res.status(503).json({
      error: 'Database unavailable. The server cannot read or write data right now.',
    });
  }
}
