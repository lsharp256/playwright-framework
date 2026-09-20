/**
 * Lightweight mock API server for load tests (dummyjson-compatible subset).
 * Used by CI so load tests never hit a rate-limited third-party host.
 *
 * Endpoints:
 *  POST /auth/login        -> { accessToken, ... }
 *  GET  /users             -> { users, total, skip, limit }
 *  GET  /users/:id         -> user
 *  POST /users/add         -> created user (+ Location)
 *
 * Start: node tests/load/mock/mock-api-server.mjs [port]
 */
import { createServer } from 'node:http';

const PORT = Number(process.argv[2] || process.env.MOCK_API_PORT || 3000);
const startedAt = Date.now();

const TOKEN = 'mock-token-' + Math.random().toString(36).slice(2);

const USERS = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  firstName: `User${i + 1}`,
  lastName: `Mock`,
  email: `user${i + 1}@mock.local`,
  username: `user${i + 1}`,
  role: i === 0 ? 'admin' : 'user',
}));

// simple per-user in-memory store for created users
const created = [];

function json(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  });
  res.end(data);
}

function makeUser(body) {
  const id = 1000 + created.length + 1;
  return {
    id,
    firstName: body?.firstName || 'LoadUser',
    lastName: body?.lastName || 'Mock',
    age: Number(body?.age) || 30,
  };
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method;

  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      /* ignore malformed bodies */
    }

    if (method === 'POST' && path === '/auth/login') {
      return json(res, 200, {
        accessToken: TOKEN,
        refreshToken: TOKEN + '-refresh',
        id: 1,
        username: body?.username || 'mockuser',
        email: 'mockuser@mock.local',
        firstName: 'Mock',
        lastName: 'User',
      });
    }

    if (method === 'GET' && path === '/users') {
      const limit = Number(url.searchParams.get('limit') || 10);
      const skip = Number(url.searchParams.get('skip') || 0);
      const all = [...USERS, ...created];
      return json(res, 200, {
        users: all.slice(skip, skip + limit),
        total: all.length,
        skip,
        limit,
      });
    }

    const userMatch = /^\/users\/(\d+)$/.exec(path);
    if (method === 'GET' && userMatch) {
      const id = Number(userMatch[1]);
      const user = [...USERS, ...created].find((u) => u.id === id);
      if (user) return json(res, 200, user);
      return json(res, 404, { message: `User with id '${id}' not found` });
    }

    if (method === 'POST' && (path === '/users/add' || path === '/users')) {
      const user = makeUser(body);
      created.push(user);
      return json(res, 201, user);
    }

    json(res, 404, { message: `No route: ${method} ${path}` });
  });
});

server.listen(PORT, () => {
  console.log(`[mock-api] listening on http://localhost:${PORT} (pid=${process.pid})`);
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
