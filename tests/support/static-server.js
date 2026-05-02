const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const port = Number(process.env.PORT || 4173);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

function routeCandidates(urlPath) {
  var clean = decodeURIComponent(urlPath.split('?')[0]);
  if (clean === '/') return ['index.html'];
  clean = clean.replace(/^\/+/, '');

  if (clean.endsWith('/')) return [path.join(clean, 'index.html')];

  if (path.extname(clean)) return [clean];
  return [path.join(clean, 'index.html'), clean + '.html'];
}

function resolveCandidate(candidate) {
  var file = path.resolve(root, candidate);
  if (file.toLowerCase().indexOf(root.toLowerCase()) !== 0) return null;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function parseCookies(header) {
  return String(header || '').split(';').reduce(function(acc, part) {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

const server = http.createServer(function(req, res) {
  if (req.url.split('?')[0] === '/api/auth/session') {
    const cookies = parseCookies(req.headers.cookie);
    const mode = cookies.afrotools_test_session || '';
    if (mode === 'valid') {
      sendJson(res, 200, {
        authenticated: true,
        user: {
          id: 'test-user-1',
          email: 'tester@afrotools.com',
          name: 'Test User',
          country: 'NG',
          tier: 'free',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      });
      return;
    }
    if (mode === 'expired') {
      sendJson(res, 401, {
        authenticated: false,
        error: 'Your session has expired. Sign in again to continue.',
      });
      return;
    }
    sendJson(res, 200, { user: null, authenticated: false });
    return;
  }

  for (const candidate of routeCandidates(req.url)) {
    const file = resolveCandidate(candidate);
    if (!file) continue;
    res.writeHead(200, {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end('Not found');
});

server.listen(port, '127.0.0.1', function() {
  console.log('AfroTools static test server running at http://127.0.0.1:' + port);
});
