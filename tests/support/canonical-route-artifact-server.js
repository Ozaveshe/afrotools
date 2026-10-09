'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

// A bounded routing model for artifact regression tests. Netlify candidate
// execution remains required because this is not a complete provider emulator.
async function startCanonicalRouteArtifactServer(root = path.resolve(__dirname, '../../dist')) {
  if (!fs.existsSync(path.join(root, 'index.html'))) throw Error('Build dist before canonical route tests');
  const rules = [];
  for (const line of fs.readFileSync(path.join(root, '_redirects'), 'utf8').split(/\r?\n/)) {
    // Only unconditional path rules are modeled; host/query/condition matching
    // and external proxying still require real provider execution.
    const parts = line.replace(/\s+#.*$/, '').trim().split(/\s+/);
    const [from, to, status] = parts;
    if (parts.length !== 3 || !from.startsWith('/') || from.includes('?') || !/^(?:200|301|302|307|308)!?$/.test(status)) continue;
    const names = [];
    const pattern = from.split(/(:[A-Za-z][\w]*|\*)/).map(part => {
      if (part === '*') { names.push('splat'); return '(.*)'; }
      if (part.startsWith(':')) { names.push(part.slice(1)); return '([^/]+)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    rules.push({ pattern: new RegExp('^' + pattern + '$'), names, to, status: parseInt(status, 10), force: status.endsWith('!') });
  }
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
  const isFile = file => fs.existsSync(file) && fs.statSync(file).isFile();
  function resolveStatic(pathname) {
    let file = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return { forbidden: true };
    let location;
    if (!path.extname(pathname)) {
      const stem = file.replace(/[\\/]$/, '');
      // Observed provider behavior: flat HTML shadows a same-stem directory.
      if (isFile(stem + '.html')) {
        if (pathname.endsWith('/')) location = pathname.slice(0, -1);
        file = stem + '.html';
      } else if (isFile(path.join(stem, 'index.html'))) {
        if (!pathname.endsWith('/')) location = pathname + '/';
        file = path.join(stem, 'index.html');
      }
    }
    return { file, location, exists: isFile(file) };
  }
  const server = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
    const redirect = (to, status = 301) => { res.writeHead(status, { Location: to }); res.end(); };
    let resolved = resolveStatic(pathname);
    if (resolved.forbidden) { res.writeHead(403); return res.end(); }
    // Netlify processes the first matching rule in file order. A static file
    // shadows a non-forced first match; processing does not jump to later rules.
    for (const rule of rules) {
      const match = rule.pattern.exec(pathname);
      if (!match) continue;
      if (!rule.force && resolved.exists) break;
      const values = Object.fromEntries(rule.names.map((name, i) => [name, match[i + 1]]));
      const to = rule.to.replace(/:([A-Za-z][\w]*)/g, (token, name) => values[name] ?? token);
      if (rule.status !== 200) return redirect(to, rule.status);
      if (!to.startsWith('/')) { res.writeHead(501); return res.end('External proxy not modeled'); }
      resolved = resolveStatic(new URL(to, 'http://localhost').pathname);
      resolved.location = undefined; // A rewrite serves bytes without navigation.
      break;
    }
    if (resolved.forbidden) { res.writeHead(403); return res.end(); }
    if (!resolved.exists) { res.writeHead(404); return res.end('Missing'); }
    if (resolved.location) return redirect(resolved.location);
    const { file } = resolved;
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { baseURL: 'http://127.0.0.1:' + server.address().port, close: () => new Promise(resolve => server.close(resolve)) };
}
module.exports = { startCanonicalRouteArtifactServer };
