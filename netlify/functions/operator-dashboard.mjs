import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getStore } from '@netlify/blobs';
import { sanitizeEngine, STORE } from './_shared/operator-engine.mjs';

const BASE = '/api/operator-dashboard/';
const COOKIE = '__Host-afro_ops';
const TTL = 1800;
const FILES = Object.freeze({
  'dashboard.js': ['admin/operator-dashboard.js', 'text/javascript; charset=utf-8'],
  'engine.js': ['admin/operator-engine.js', 'text/javascript; charset=utf-8'],
  'dashboard.css': ['admin/operator-dashboard.css', 'text/css; charset=utf-8'],
  'snapshot.json': ['admin/data/operator-dashboard.json', 'application/json; charset=utf-8'],
  'pro-readiness.md': ['docs/PRO-APP-READINESS.md', 'text/plain; charset=utf-8'],
  'pro-gates.json': ['admin/data/pro-gate-coverage.json', 'application/json; charset=utf-8']
});
const HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
};
function response(body, status = 200, extra = {}) {
  return new Response(body, { status, headers: { ...HEADERS, 'Content-Type': 'text/plain; charset=utf-8', ...extra } });
}
function equal(a, b) {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
function signature(payload, secret) {
  return createHmac('sha256', secret).update('afrotools-operator-v1:' + payload).digest('base64url');
}
export function issueSession(secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ exp: now + TTL * 1000, issued: now, nonce: randomBytes(24).toString('base64url') })).toString('base64url');
  return payload + '.' + signature(payload, secret);
}
export function validSession(cookie, secret, now = Date.now()) {
  if (!secret || typeof cookie !== 'string' || cookie.length > 1024) return false;
  const parts = cookie.split('.');
  if (parts.length !== 2 || !equal(parts[1], signature(parts[0], secret))) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    return Number.isSafeInteger(payload.exp) && Number.isSafeInteger(payload.issued) &&
      payload.issued <= now && payload.exp > now && payload.exp - payload.issued === TTL * 1000 && typeof payload.nonce === 'string';
  } catch (_) { return false; }
}
function cookieValue(request) {
  const matches = (request.headers.get('cookie') || '').split(';').map(p=>p.trim()).filter(p=>p.startsWith(COOKIE+'='));
  return matches.length === 1 ? matches[0].slice(COOKIE.length+1) : '';
}
function cookieHeader(value, age = TTL) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;
}
function login(message = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>AfroTools operator login</title><link rel="stylesheet" href="/assets/css/design-system.css"></head><body><main class="page-shell container"><h1>Operator dashboard</h1><p>Sign in with the existing AfroTools admin credential.</p><p role="status">${message}</p><form method="post" action="${BASE}login"><div class="form-field"><label class="form-label" for="admin-credential">Admin credential</label><input class="form-input" id="admin-credential" name="credential" type="password" autocomplete="current-password" required maxlength="1024"></div><button class="btn btn-primary" type="submit">Sign in</button></form><p>Session expires after 30 minutes. The credential is never stored in browser storage.</p></main></body></html>`;
}
export default async function handler(request, context = {}) {
  const secret = process.env.ADMIN_KEY || process.env.ADMIN_SECRET || '';
  if (!secret) return response('Operator access is not configured.', 503);
  const url = new URL(request.url);
  const resource = url.pathname.startsWith(BASE) ? url.pathname.slice(BASE.length) : '';
  const dashboard = ['/mc-7a2f9x','/mc-7a2f9x.html','/.netlify/functions/operator-dashboard'].includes(url.pathname);
  if (!dashboard && !Object.hasOwn(FILES,resource) && !['login','logout','session','operations.json'].includes(resource)) return response('Not found',404);
  if (request.method === 'POST' && ['login','logout'].includes(resource)) {
    if (request.headers.get('origin') !== url.origin) return response('Origin rejected',403);
    if (resource === 'logout') return response(null,303,{ Location:'/mc-7a2f9x.html','Set-Cookie':cookieHeader('',0) });
    if (!(request.headers.get('content-type') || '').startsWith('application/x-www-form-urlencoded')) return response('Unsupported form',415);
    if (Number(request.headers.get('content-length')) > 4096) return response('Form too large',413);
    const body = await request.text();
    if (Buffer.byteLength(body) > 4096) return response('Form too large',413);
    const supplied = new URLSearchParams(body).get('credential') || '';
    if (!supplied || !equal(supplied,secret)) return response(login('Credential not accepted.'),401,{'Content-Type':'text/html; charset=utf-8','Set-Cookie':cookieHeader('',0)});
    return response(null,303,{ Location:'/mc-7a2f9x.html','Set-Cookie':cookieHeader(issueSession(secret)) });
  }
  if (!['GET','HEAD'].includes(request.method)) return response('Method not allowed',405,{Allow:'GET, HEAD, POST'});
  const authenticated = validSession(cookieValue(request),secret);
  if (resource === 'session') return response(JSON.stringify({authenticated}),authenticated?200:401,{'Content-Type':'application/json'});
  if (!authenticated) return response(request.method === 'HEAD' ? null : dashboard ? login() : 'Authentication required',401,{'Content-Type':dashboard?'text/html; charset=utf-8':'text/plain; charset=utf-8'});
  if (resource === 'operations.json') {
    try {
      const payload = await (context.readOperations ? context.readOperations() : getStore({name:STORE,consistency:'strong'}).get('latest',{type:'json'}));
      return response(request.method === 'HEAD' ? null : JSON.stringify(sanitizeEngine(payload)),200,{'Content-Type':'application/json; charset=utf-8'});
    } catch { return response(request.method === 'HEAD' ? null : JSON.stringify({available:false,message:'Operational sync is unavailable. The last successful sync may be old or missing.'}),503,{'Content-Type':'application/json; charset=utf-8'}); }
  }
  if (!dashboard && !Object.hasOwn(FILES,resource)) return response('Method not allowed',405);
  const [file,type] = dashboard ? ['mc-7a2f9x.html','text/html; charset=utf-8'] : FILES[resource];
  try {
    let body = readFileSync(resolve(process.cwd(),file));
    // Compact the large audit ledger to stay under buffered function response limits.
    if (resource === 'snapshot.json') body = Buffer.from(JSON.stringify(JSON.parse(body)));
    return response(request.method === 'HEAD' ? null : body,200,{'Content-Type':type});
  } catch (_) { return response('Operator resource unavailable.',503); }
}
export const config = {
  path: ['/api/operator-dashboard/*', '/mc-7a2f9x', '/mc-7a2f9x.html', '/.netlify/functions/operator-dashboard'],
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip','domain'] }
};
