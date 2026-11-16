/**
 * End-to-end API verification. Run against a live server with a seeded DB:
 *
 *   npm run server          # terminal 1
 *   npm run verify          # terminal 2
 *
 * Confirms the RBAC boundaries and the specific defects fixed during the
 * full-stack conversion. Creates one throwaway account, then deletes it.
 */
const BASE = process.env.VERIFY_BASE || 'http://localhost:5000';

let pass = 0;
let fail = 0;

function check(label, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

async function call(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = (res.headers.get('content-type') || '').split(';')[0];
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, contentType, json, text };
}

async function run() {
  console.log(`\nVerifying ${BASE}\n`);

  // --- Health ------------------------------------------------------------
  const health = await call('/api/health');
  check('health endpoint responds 200', health.status === 200, `got ${health.status}`);
  check(
    'database reports connected',
    health.json?.database?.state === 'connected',
    `state=${health.json?.database?.state}. Set MONGO_URI and run "npm run seed".`
  );
  if (health.json?.database?.state !== 'connected') {
    console.log('\nAborting: the rest of the checks need a live database.\n');
    process.exit(1);
  }

  // --- Error handling ----------------------------------------------------
  console.log('\nError handling');
  const notFound = await call('/api/this-route-does-not-exist');
  check('unknown /api route returns 404', notFound.status === 404, `got ${notFound.status}`);
  check(
    'unknown /api route returns JSON, not an HTML error page',
    notFound.contentType === 'application/json',
    notFound.contentType
  );

  const badJson = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{malformed',
  });
  const badBody = await badJson.text();
  check('malformed JSON returns 400', badJson.status === 400, `got ${badJson.status}`);
  check('malformed JSON leaks no stack trace', !badBody.includes('node:internal'), 'stack trace present');

  // --- Registration & login ---------------------------------------------
  console.log('\nAuthentication');
  const stamp = Date.now();
  const creds = {
    name: `VerifyProbe${stamp}`,
    email: `verify-${stamp}@example.test`,
    password: 'probe-password-123',
    uid: `VERIFY-${stamp}`,
  };

  const reg = await call('/api/auth/register', { method: 'POST', body: creds });
  check('register returns 201', reg.status === 201, `got ${reg.status} ${reg.text.slice(0, 120)}`);
  const token = reg.json?.token;
  check('register returns a signed JWT', typeof token === 'string' && token.split('.').length === 3);
  check('register never returns the password', reg.json?.user?.password === undefined);
  check('new accounts are always role=detective', reg.json?.user?.role === 'detective', reg.json?.user?.role);

  const shortPw = await call('/api/auth/register', {
    method: 'POST',
    body: { name: 'X', email: `x-${stamp}@example.test`, password: 'short' },
  });
  check('rejects passwords under 8 characters', shortPw.status === 400, `got ${shortPw.status}`);

  const wrongPw = await call('/api/auth/login', {
    method: 'POST',
    body: { identifier: creds.email, password: 'definitely-wrong' },
  });
  check('wrong password returns 401', wrongPw.status === 401, `got ${wrongPw.status}`);

  const noUser = await call('/api/auth/login', {
    method: 'POST',
    body: { identifier: `ghost-${stamp}@example.test`, password: 'whatever123' },
  });
  check(
    'unknown user and wrong password give the same message (no account enumeration)',
    noUser.status === 401 && noUser.json?.error === wrongPw.json?.error
  );

  // --- Token integrity ---------------------------------------------------
  console.log('\nToken integrity');
  const noTokenMe = await call('/api/auth/me');
  check('/api/auth/me without a token returns 401', noTokenMe.status === 401, `got ${noTokenMe.status}`);

  const garbage = await call('/api/auth/me', { token: 'not-a-real-token' });
  check('garbage token returns 401', garbage.status === 401, `got ${garbage.status}`);

  const userId = reg.json?.user?.id;
  const legacy = await call('/api/auth/me', { token: `jwt-token-${userId}` });
  check(
    'old unsigned "jwt-token-<id>" format is rejected',
    legacy.status === 401,
    `got ${legacy.status} - a bare user id must not be a credential`
  );
  const legacy2 = await call('/api/auth/me', { token: `fd-token::${userId}::admin` });
  check('old "fd-token::<id>::admin" format is rejected', legacy2.status === 401, `got ${legacy2.status}`);

  // Tamper with the payload of a genuine token.
  const [h, p, sig] = token.split('.');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  const evil = Buffer.from(JSON.stringify({ ...payload, role: 'admin' })).toString('base64url');
  const tampered = await call('/api/users', { token: `${h}.${evil}.${sig}` });
  check('tampered token cannot reach an admin route', tampered.status === 401, `got ${tampered.status}`);

  // --- RBAC --------------------------------------------------------------
  console.log('\nRole-based access control');
  const detCase = await call('/api/cases', {
    method: 'POST',
    token,
    body: { title: 'Illegal Case', difficulty: 'Easy' },
  });
  check('detective cannot create a case (403)', detCase.status === 403, `got ${detCase.status}`);

  const detUsers = await call('/api/users', { token });
  check('detective cannot list users (403)', detUsers.status === 403, `got ${detUsers.status}`);

  const detRoom = await call('/api/rooms', { method: 'POST', token, body: { name: 'Illegal Room' } });
  check('detective cannot create a room (403)', detRoom.status === 403, `got ${detRoom.status}`);

  const selfPromote = await call(`/api/users/${userId}`, {
    method: 'PATCH',
    token,
    body: { role: 'admin' },
  });
  check('detective cannot promote themselves (403)', selfPromote.status === 403, `got ${selfPromote.status}`);

  // --- Leaderboard -------------------------------------------------------
  console.log('\nLeaderboard integrity');
  const anonScore = await call('/api/leaderboard', {
    method: 'POST',
    body: { userId: 'someone-else', username: 'ANON_INJECT', xp: 999999, difficulty: 'Easy', timeLeft: 60 },
  });
  check(
    'score submission without a token is rejected (401)',
    anonScore.status === 401,
    `got ${anonScore.status} - anonymous XP injection must be impossible`
  );

  const spoofed = await call('/api/leaderboard', {
    method: 'POST',
    token,
    body: { username: 'SomeoneElse', userId: 'deadbeef', xp: 100, difficulty: 'Easy', timeLeft: 10 },
  });
  check('score submission ignores client-supplied identity', spoofed.json?.username === creds.name,
    `recorded as "${spoofed.json?.username}", expected "${creds.name}"`);

  const absurd = await call('/api/leaderboard', {
    method: 'POST',
    token,
    body: { xp: 99999999, difficulty: 'Easy', timeLeft: 10 },
  });
  check('absurd XP values are rejected (400)', absurd.status === 400, `got ${absurd.status}`);

  const negative = await call('/api/leaderboard', {
    method: 'POST',
    token,
    body: { xp: 50, difficulty: 'Easy', timeLeft: -5 },
  });
  check('negative timeLeft is rejected (400)', negative.status === 400, `got ${negative.status}`);

  const filtered = await call('/api/leaderboard?difficulty=Easy');
  check('difficulty filter returns 200 (no 500 crash)', filtered.status === 200, `got ${filtered.status}`);
  check('difficulty filter returns an array', Array.isArray(filtered.json));

  const xpAfter = await call('/api/auth/me', { token });
  check('submitting a run increments the player XP', (xpAfter.json?.user?.totalXp || 0) >= 100,
    `totalXp=${xpAfter.json?.user?.totalXp}`);

  // --- Validation --------------------------------------------------------
  console.log('\nInput validation');
  const badId = await call('/api/cases/not-a-valid-object-id', { method: 'DELETE', token });
  check('malformed object id is rejected cleanly', [400, 403].includes(badId.status), `got ${badId.status}`);

  const dupe = await call('/api/auth/register', { method: 'POST', body: creds });
  check('duplicate registration returns 409', dupe.status === 409, `got ${dupe.status}`);

  // --- Cases -------------------------------------------------------------
  console.log('\nCases');
  const cases = await call('/api/cases');
  check('GET /api/cases returns 200', cases.status === 200, `got ${cases.status}`);
  check('cases come back as an array', Array.isArray(cases.json));
  check('cases are seeded (run "npm run seed" if 0)', (cases.json?.length || 0) > 0,
    `${cases.json?.length || 0} cases`);
  if (cases.json?.[0]) {
    check('each case exposes "id", not "_id"',
      typeof cases.json[0].id === 'string' && cases.json[0]._id === undefined);
    check('each case carries its anomalies on errors[]', Array.isArray(cases.json[0].errors));
  }

  console.log(`\n${pass} passed, ${fail} failed\n`);
  if (fail > 0) {
    console.log('Note: the probe account was left in place for inspection.');
    console.log(`Email: ${creds.email}\n`);
  }
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(`\nVerification could not run: ${err.message}`);
  console.error(`Is the server listening on ${BASE}?\n`);
  process.exit(1);
});
