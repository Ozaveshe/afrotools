#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const pkg = JSON.parse(read('package.json'));
const mcp = JSON.parse(read('.mcp.json'));
const deployChannel = JSON.parse(read('ops/deploy-channel.json'));
const netlify = read('netlify.toml');
const ci = read('.github/workflows/ci.yml');

assert.strictEqual(pkg.engines.node, '24.x', 'Node version must be pinned across environments');
assert(!/build-public-claims\.js --check/.test(pkg.scripts['build:checks']),
  'build:checks must not repeat the public-claim registry scan');
assert(!/audit-public-claims\.js/.test(pkg.scripts['build:checks']),
  'build:checks must not repeat the public-claim audit scan');
assert(/build-public-claims\.js --write/.test(pkg.scripts['build:seo']),
  'build:seo must retain the single claim generation/validation pass');
assert(pkg.scripts['deploy:ready'].startsWith('git fetch --prune origin &&'),
  'release readiness must refresh origin/main before proving exact alignment');

assert.deepStrictEqual(Object.keys(mcp.mcpServers), ['supabase'],
  'shared MCP config should contain only the required working server');
assert(mcp.mcpServers.supabase.url.includes('project_ref=zpclagtgczsygrgztlts'),
  'Supabase MCP must target AfroTools');
assert.strictEqual(mcp.mcpServers.supabase.headers.Authorization,
  'Bearer ${SUPABASE_ACCESS_TOKEN}', 'Supabase auth must come from the environment');
assert.deepStrictEqual(deployChannel.git.releaseBranches, ['main'],
  'only main may be a production release branch');

const commands = Array.from(netlify.matchAll(/^\s*command\s*=\s*"([^"]+)"/gm), (match) => match[1]);
assert(commands.length >= 4, 'all Netlify deploy contexts must declare build commands');
assert(commands.every((command) => command.includes('npm run deploy:verify') &&
  command.includes('npm run build:deploy')), 'all Netlify contexts must use the verified build path');
assert(/NODE_VERSION\s*=\s*"24"/.test(netlify), 'Netlify must use Node 24');
assert.strictEqual((ci.match(/node-version: '24'/g) || []).length, 3,
  'all CI jobs must use Node 24');
assert(read('CLAUDE.md').includes('Read `AGENTS.md`'), 'Claude must share the repository guide');
assert(read('docs/DEPLOYMENT-WORKFLOW.md').includes('One Production Path'),
  'deployment operating contract must be documented');

execFileSync(process.execPath, ['scripts/deploy-doctor.js'], { cwd: ROOT, stdio: 'pipe' });

function verifyChannel(args, env = {}) {
  return spawnSync(process.execPath, ['scripts/verify-deploy-channel.js', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

const siteId = deployChannel.netlify.siteId;
const preview = verifyChannel(['--allow-dirty'], {
  NETLIFY: 'true',
  SITE_ID: siteId,
  CONTEXT: 'deploy-preview',
  PULL_REQUEST: 'true',
  REVIEW_ID: '33',
  HEAD: 'codex/deploy-environment-hardening',
  COMMIT_REF: '0123456789abcdef',
});
assert.strictEqual(preview.status, 0, preview.stderr || 'deploy preview contract must pass');

const production = verifyChannel(['--allow-dirty'], {
  NETLIFY: 'true',
  SITE_ID: siteId,
  CONTEXT: 'production',
  HEAD: 'main',
  COMMIT_REF: '0123456789abcdef',
});
assert.strictEqual(production.status, 0, production.stderr || 'production main contract must pass');

const wrongProduction = verifyChannel(['--allow-dirty'], {
  NETLIFY: 'true',
  SITE_ID: siteId,
  CONTEXT: 'production',
  HEAD: 'feature/not-main',
  COMMIT_REF: '0123456789abcdef',
});
assert.notStrictEqual(wrongProduction.status, 0, 'production must reject non-main branches');

console.log('Deploy environment contract tests passed.');
