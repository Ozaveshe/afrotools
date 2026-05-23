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
  '.xml': 'application/xml; charset=utf-8'
};

function routeCandidates(url) {
  let pathname = decodeURIComponent(url.split('?')[0]);
  if (pathname === '/') return ['index.html'];
  pathname = pathname.replace(/^\/+/, '');
  if (pathname.endsWith('/')) return [path.join(pathname, 'index.html')];
  if (path.extname(pathname)) return [pathname];
  return [path.join(pathname, 'index.html'), pathname + '.html'];
}

function resolveCandidate(candidate) {
  const resolved = path.resolve(root, candidate);
  if (!resolved.toLowerCase().startsWith(root.toLowerCase())) return null;
  return fs.existsSync(resolved) && fs.statSync(resolved).isFile() ? resolved : null;
}

function sendJson(response, status, body, headers) {
  response.writeHead(status, Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  }, headers || {}));
  response.end(JSON.stringify(body));
}

function parseCookies(header) {
  return String(header || '').split(';').reduce(function (cookies, part) {
    const index = part.indexOf('=');
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function bearerToken(request) {
  const match = String(request.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function queryParams(requestUrl) {
  const parsed = new URL(requestUrl, 'http://127.0.0.1:' + port);
  return Object.fromEntries(parsed.searchParams.entries());
}

async function invokeFunction(functionName, request, response) {
  const body = await readRequestBody(request);
  const functionPath = path.join(root, 'netlify', 'functions', functionName + '.js');
  delete require.cache[require.resolve(functionPath)];
  const fn = require(functionPath);
  const result = await fn.handler({
    httpMethod: request.method,
    headers: request.headers,
    queryStringParameters: queryParams(request.url),
    body,
    path: request.url.split('?')[0]
  });
  response.writeHead(result.statusCode || 200, result.headers || {});
  response.end(result.body || '');
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    request.on('data', function (chunk) { chunks.push(chunk); });
    request.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8') || null); });
    request.on('error', reject);
  });
}

const server = http.createServer(function (request, response) {
  const pathname = request.url.split('?')[0];

  if (pathname === '/api/auth/session') {
    const session = parseCookies(request.headers.cookie).afrotools_test_session || '';
    const token = bearerToken(request);
    if (session === 'valid' || token === 'valid-browser-token') {
      return sendJson(response, 200, {
        authenticated: true,
        bridged: token === 'valid-browser-token',
        user: {
          id: 'test-user-1',
          email: 'tester@afrotools.com',
          name: 'Test User',
          country: 'NG',
          tier: 'free',
          createdAt: '2026-01-01T00:00:00.000Z'
        }
      }, token === 'valid-browser-token'
        ? { 'Set-Cookie': 'afro_session=valid-browser-token; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600' }
        : null);
    }
    if (session === 'expired' || token === 'expired-browser-token') {
      return sendJson(response, 401, {
        authenticated: false,
        error: 'Your session has expired. Sign in again to continue.'
      });
    }
    return sendJson(response, 200, { user: null, authenticated: false });
  }

  if (pathname === '/api/matchday/leaderboard') {
    return invokeFunction('matchday-leaderboard', request, response).catch(function (error) {
      console.error(error);
      sendJson(response, 500, { error: 'Matchday leaderboard failed locally.' });
    });
  }

  if (pathname === '/api/matchday/fixtures-sync-status') {
    return invokeFunction('matchday-fixtures-sync-status', request, response).catch(function (error) {
      console.error(error);
      sendJson(response, 500, { error: 'Matchday fixture sync status failed locally.' });
    });
  }

  if (pathname.startsWith('/.netlify/functions/')) {
    const functionName = pathname.replace('/.netlify/functions/', '').split('/')[0];
    if (/^[a-z0-9-_]+$/i.test(functionName)) {
      return invokeFunction(functionName, request, response).catch(function (error) {
        console.error(error);
        sendJson(response, 500, { error: functionName + ' failed locally.' });
      });
    }
  }

  for (const candidate of routeCandidates(request.url)) {
    const resolved = resolveCandidate(candidate);
    if (resolved) {
      response.writeHead(200, {
        'Content-Type': types[path.extname(resolved).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(resolved).pipe(response);
      return;
    }
  }

  response.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end('Not found');
});

server.listen(port, '127.0.0.1', function () {
  console.log('AfroTools static test server running at http://127.0.0.1:' + port);
});
