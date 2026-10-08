'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

// A bounded routing model for artifact regression tests. Netlify candidate
// execution remains required because this is not a complete provider emulator.
async function startCanonicalRouteArtifactServer(root = path.resolve(__dirname, '../../dist')) {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw Error('Build dist before canonical route tests');
  const forced = new Map();
  for (const line of fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/)) {
    const [from, to, status] = line.trim().split(/\s+/);
    if (from && !from.includes('*') && /^30[12]!$/.test(status || '') && !forced.has(from)) forced.set(from, to);
  }
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
  const isFile = file => fs.existsSync(file) && fs.statSync(file).isFile();
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
    const redirect = to => { res.writeHead(301, { Location: to }); res.end(); };
    if (forced.has(pathname)) return redirect(forced.get(pathname));
    let file = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); return res.end(); }
    if (!path.extname(pathname)) {
      const stem = file.replace(/[\\/]$/, '');
      // The observed provider gives flat HTML precedence over a same-stem
      // directory. Keep this collision visible instead of masking it locally.
      if (isFile(stem + '.html')) {
        if (pathname.endsWith('/')) return redirect(pathname.slice(0, -1));
        file = stem + '.html';
      } else if (isFile(path.join(stem, 'index.html'))) {
        if (!pathname.endsWith('/')) return redirect(pathname + '/');
        file = path.join(stem, 'index.html');
      }
    }
    if (!isFile(file)) { res.writeHead(404); return res.end('Missing'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { baseURL: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(resolve => server.close(resolve)) };
}
module.exports = { startCanonicalRouteArtifactServer };
