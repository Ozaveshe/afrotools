#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const EXPECTED_REF = 'zpclagtgczsygrgztlts';
const EXPECTED_URL = `https://${EXPECTED_REF}.supabase.co`;
const RETIRED_REF = 'jbmhfpkzbgyeodsqhprx';
const DEPLOYABLE_PATHS = [
  '_headers',
  '_redirects',
  'assets/js',
  'engines',
  'netlify/functions',
  'netlify/edge-functions'
];

function fail(message) {
  console.error(`Supabase consolidation verification failed: ${message}`);
  process.exitCode = 1;
}

function walk(target, files) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    walk(path.join(target, entry.name), files);
  }
}

function decodeRef(value) {
  if (!value) return '(missing)';
  const parts = String(value).split('.');
  if (parts.length < 2) return '(non-jwt)';
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.ref) return payload.ref;
    const match = String(payload.iss || '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
    return match ? match[1] : '(jwt-without-ref)';
  } catch (_error) {
    return '(invalid-jwt)';
  }
}

const files = [];
for (const relative of DEPLOYABLE_PATHS) {
  const target = path.join(ROOT, relative);
  if (fs.existsSync(target)) walk(target, files);
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (source.includes(RETIRED_REF)) {
    fail(`retired project ref remains in ${path.relative(ROOT, file)}`);
  }
}

const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, '.mcp.json'), 'utf8'));
const localSupabase = mcp.mcpServers && mcp.mcpServers.supabase;
if (!localSupabase || !String(localSupabase.url || '').includes(`project_ref=${EXPECTED_REF}`)) {
  fail('repo-local MCP server "supabase" is not pinned to the AfroTools project');
}

const deployChannel = JSON.parse(fs.readFileSync(path.join(ROOT, 'ops', 'deploy-channel.json'), 'utf8'));
if (!deployChannel.supabase || deployChannel.supabase.projectRef !== EXPECTED_REF) {
  fail('ops/deploy-channel.json is not pinned to the AfroTools project');
}

if (process.argv.includes('--netlify')) {
  let raw;
  try {
    const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npx';
    const args = process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npx netlify env:list --json']
      : ['netlify', 'env:list', '--json'];
    raw = execFileSync(command, args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    fail(`could not read Netlify environment: ${String(error.stderr || error.message).trim()}`);
    process.exit(1);
  }

  const env = JSON.parse(raw);
  for (const name of ['SUPABASE_URL', 'SUPABASE_AUTH_URL']) {
    if (String(env[name] || '').replace(/\/$/, '') !== EXPECTED_URL) {
      fail(`${name} must target ${EXPECTED_URL}`);
    }
  }
  for (const name of [
    'SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY_AUTH',
    'SUPABASE_DATA_ANON_KEY',
    'SUPABASE_AUTH_SERVICE_KEY',
    'SUPABASE_DATA_SERVICE_ROLE_KEY',
    'SUPABASE_SERVICE_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]) {
    const ref = decodeRef(env[name]);
    if (ref !== EXPECTED_REF) fail(`${name} belongs to ${ref}, expected ${EXPECTED_REF}`);
  }
}

if (!process.exitCode) {
  console.log(`Supabase consolidation verified: ${EXPECTED_REF}`);
}
