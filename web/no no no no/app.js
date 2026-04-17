const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const path = require('path');
const crypto = require('crypto');

const siftModule = require('sift');
const sift = siftModule.default || siftModule;

const app = express();
const port = process.env.PORT || 3000;

const FLAG = process.env.FLAG || 'Cyberkits{sixxxsevennn_G00D_J0B}';
const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('hex');

const users = [
  {
    id: 1,
    username: 'admin',
    password: adminPassword,
    role: 'admin',
    bio: 'superuser'
  },
  {
    id: 2,
    username: 'player',
    password: 'player123',
    role: 'user',
    bio: 'new challenger'
  }
];

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ctf-dev-secret-please-change',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax'
    }
  })
);

function hasDangerousString(value) {
  if (typeof value !== 'string') return false;

  const lower = value.toLowerCase();
  if (value.includes('{') || value.includes('}') || value.includes(';')) return true;

  return ['${', '$where', 'function', 'sleep(', 'benchmark(', 'javascript:'].some((token) =>
    lower.includes(token)
  );
}

function weakFilter(input) {
  if (input === null || input === undefined) return;

  if (typeof input === 'string') {
    if (hasDangerousString(input)) {
      throw new Error('Input ditolak oleh WAF mini.');
    }
    return;
  }

  if (typeof input === 'object' && !Array.isArray(input)) {
    for (const key of Object.keys(input)) {
      if (key.startsWith('$') || key.includes('.')) {
        throw new Error('Operator Mongo tidak diizinkan.');
      }

      const directValue = input[key];
      if (typeof directValue === 'string' && hasDangerousString(directValue)) {
        throw new Error('String berbahaya terdeteksi.');
      }
    }
  }
}

function normalizeUnicodeDollarKey(key) {
  return key.replace(/[＄﹩]/g, '$');
}

function deepNormalizeObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => deepNormalizeObject(item));
  }

  if (value && typeof value === 'object') {
    const normalized = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      normalized[normalizeUnicodeDollarKey(key)] = deepNormalizeObject(nestedValue);
    }
    return normalized;
  }

  return value;
}

function sanitizeOutgoingUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    bio: user.bio
  };
}

app.get('/', (req, res) => {
  res.render('index', {
    user: req.session.user,
    challengeInfo: {
      title: 'NoSQL Injection: Unicode Operator Bypass',
      subtitle: 'CVE-inspired challenge'
    }
  });
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }

  const isAdmin = req.session.user.role === 'admin';

  res.render('dashboard', {
    user: req.session.user,
    flag: isAdmin ? FLAG : null
  });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.post('/api/login', (req, res) => {
  try {
    const supplied = {
      username: req.body.username,
      password: req.body.password
    };

    weakFilter(supplied.username);
    weakFilter(supplied.password);

    const normalizedInput = deepNormalizeObject(supplied);

    const query = {
      username: normalizedInput.username,
      password: normalizedInput.password,
      role: 'admin'
    };

    const admin = users.find((candidate) => sift(query)(candidate));

    if (!admin) {
      return res.status(401).json({
        ok: false,
        message: 'Login gagal. Kredensial tidak valid.'
      });
    }

    req.session.user = sanitizeOutgoingUser(admin);

    return res.json({
      ok: true,
      message: `Welcome, ${admin.username}`,
      redirect: '/dashboard'
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      message: error.message || 'Payload ditolak.'
    });
  }
});

app.listen(port, () => {
  // Intentionally printed for challenge hosters, not shown to players in normal CTF infra.
  console.log(`[CTF] Listening at http://localhost:${port}`);
  console.log(`[CTF] Admin password (host-only): ${adminPassword}`);
});
