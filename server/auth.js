import jwt from 'jsonwebtoken';
import User from './models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || '';
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production. Refusing to start with unsigned tokens.');
}

// Dev-only fallback so `npm run dev` works before .env is filled in. It is
// random per process, which means restarting the server invalidates sessions —
// deliberately noisy, so the missing secret gets noticed.
const EFFECTIVE_SECRET =
  JWT_SECRET || `dev-only-${Math.random().toString(36).slice(2)}-${Date.now()}`;

if (!JWT_SECRET) {
  console.warn(
    '⚠️  JWT_SECRET is not set — using a random per-process dev secret. ' +
      'Sessions will not survive a restart. Set JWT_SECRET in .env.'
  );
}

/**
 * Signs a token carrying only the user id. The role is deliberately NOT
 * trusted from the token: authenticate() re-reads it from the database on
 * every request, so promoting or demoting a user takes effect immediately
 * and a tampered payload cannot escalate privileges.
 */
export function createToken(user) {
  return jwt.sign({ sub: String(user._id) }, EFFECTIVE_SECRET, { expiresIn: TOKEN_TTL });
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = header.slice(7).trim();

    let payload;
    try {
      payload = jwt.verify(token, EFFECTIVE_SECRET);
    } catch (err) {
      const expired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        error: expired ? 'Session expired. Please sign in again.' : 'Invalid session token',
      });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorizeRoles(...allowedRoles) {
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
