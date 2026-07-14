#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const EXPECTED = Object.freeze({
  repository: 'https://github.com/Ozaveshe/afrotools',
  siteId: '8aa543db-b4bd-4631-98f8-221440055c41',
  siteName: 'afrotools',
  siteUrl: 'https://afrotools.com',
  supabaseRef: 'zpclagtgczsygrgztlts',
  nodeMajor: 24,
});

const releaseMode = process.argv.includes('--release');
const liveMode = process.argv.includes('--live');
const errors = [];
const warnings = [];
const confirmations = [];

function ok(message) {
  confirmations.push(message);
}

function warn(message) {
  warnings.push(message);
}

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function run(command, args, envOverrides = {}) {
  const needsWindowsShim = process.platform === 'win32' && ['netlify', 'claude'].includes(command);
  const executable = needsWindowsShim ? (process.env.ComSpec || 'cmd.exe') : command;
  const commandArgs = needsWindowsShim ? ['/d', '/s', '/c', command, ...args] : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...envOverrides },
    windowsHide: true,
  });
  return {
    ok: !result.error && result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error || null,
  };
}

function git(args) {
  return run('git', args);
}

function gitText(args) {
  const result = git(args);
  if (!result.ok) return null;
  return result.stdout.trim();
}

function stripAnsi(value) {
  return String(value || '').replace(/\u001b\[[0-9;]*m/g, '');
}

function parseWorktrees(raw) {
  const records = [];
  let current = {};
  for (const line of String(raw || '').split(/\r?\n/)) {
    if (!line) {
      if (current.worktree) records.push(current);
      current = {};
      continue;
    }
    const space = line.indexOf(' ');
    const key = space === -1 ? line : line.slice(0, space);
    const value = space === -1 ? true : line.slice(space + 1);
    current[key] = value;
  }
  if (current.worktree) records.push(current);
  return records;
}

function verifyStaticContract() {
  const packageJson = readJson('package.json');
  const deployChannel = readJson('ops/deploy-channel.json');
  const mcp = readJson('.mcp.json');
  const netlifyToml = readText('netlify.toml');
  const gitignore = readText('.gitignore');

  const nodeRange = String(packageJson.engines && packageJson.engines.node || '');
  if (!nodeRange.startsWith(String(EXPECTED.nodeMajor))) {
    fail(`package.json must pin Node ${EXPECTED.nodeMajor}.x; found "${nodeRange || 'unset'}".`);
  } else {
    ok(`Node contract is pinned to ${nodeRange}.`);
  }

  const currentNodeMajor = Number(process.versions.node.split('.')[0]);
  if (currentNodeMajor !== EXPECTED.nodeMajor) {
    warn(`Local Node is ${process.versions.node}; the deployment contract uses ${EXPECTED.nodeMajor}.x.`);
  } else {
    ok(`Local Node ${process.versions.node} matches the deployment major.`);
  }

  if (deployChannel.netlify.siteId !== EXPECTED.siteId ||
      deployChannel.netlify.siteName !== EXPECTED.siteName ||
      deployChannel.netlify.primaryUrl !== EXPECTED.siteUrl ||
      deployChannel.git.repository !== EXPECTED.repository ||
      deployChannel.supabase.projectRef !== EXPECTED.supabaseRef) {
    fail('ops/deploy-channel.json does not match the pinned AfroTools identities.');
  } else {
    ok('Deploy-channel identities match AfroTools.');
  }

  const servers = mcp.mcpServers || {};
  const supabase = servers.supabase || {};
  if (!String(supabase.url || '').includes(`project_ref=${EXPECTED.supabaseRef}`)) {
    fail('The repo-local Supabase MCP URL is not pinned to the AfroTools project.');
  }
  if (!supabase.headers || supabase.headers.Authorization !== 'Bearer ${SUPABASE_ACCESS_TOKEN}') {
    fail('The repo-local Supabase MCP must use the SUPABASE_ACCESS_TOKEN environment reference.');
  }
  if (servers.dataforseo) {
    fail('The optional DataForSEO MCP must not be shared until a working OAuth or credential-backed setup exists.');
  }
  if (!errors.some((message) => message.includes('Supabase MCP'))) {
    ok('Shared Supabase MCP configuration is project-pinned and environment-authenticated.');
  }

  const buildChecks = String(packageJson.scripts && packageJson.scripts['build:checks'] || '');
  const buildSeo = String(packageJson.scripts && packageJson.scripts['build:seo'] || '');
  if (/build-public-claims\.js --check|audit-public-claims\.js/.test(buildChecks)) {
    fail('build:checks repeats a full public-claim scan and will exceed the Netlify build budget.');
  }
  if (!/build-public-claims\.js --write/.test(buildSeo)) {
    fail('build:seo must own the single public-claim generation and validation pass.');
  }
  if (packageJson.scripts && packageJson.scripts['deploy:verify']) {
    ok('Deploy verification command is available.');
  } else {
    fail('package.json is missing deploy:verify.');
  }

  if (!/publish\s*=\s*"dist"/.test(netlifyToml)) {
    fail('Netlify must publish dist/.');
  }
  const deployCommands = Array.from(netlifyToml.matchAll(/^\s*command\s*=\s*"([^"]+)"/gm), (match) => match[1]);
  if (deployCommands.length < 4 || deployCommands.some((command) =>
    !command.includes('npm run deploy:verify') || !command.includes('npm run build:deploy'))) {
    fail('Production, preview, branch, and staging contexts must run deploy:verify and build:deploy.');
  } else {
    ok('All Netlify deploy contexts use the same verified build path.');
  }
  if (!/NODE_VERSION\s*=\s*"24"/.test(netlifyToml)) {
    fail('netlify.toml must pin Node 24.');
  }
  if (!/^\.worktree-ports\.json$/m.test(gitignore)) {
    fail('.worktree-ports.json must remain local and ignored.');
  }
}

function inspectGitAndWorktrees() {
  const branch = gitText(['rev-parse', '--abbrev-ref', 'HEAD']);
  const head = gitText(['rev-parse', 'HEAD']);
  const status = gitText(['status', '--porcelain=v1', '-uno']);
  const dirtyCount = status ? status.split(/\r?\n/).filter(Boolean).length : 0;
  const worktreeRaw = gitText(['worktree', 'list', '--porcelain']);

  if (!branch || !head || worktreeRaw === null) {
    fail('Git repository state could not be read.');
    return;
  }

  ok(`Git checkout is ${branch}@${head.slice(0, 12)} with ${dirtyCount} tracked change(s).`);
  const records = parseWorktrees(worktreeRaw);
  const initializing = records.filter((record) =>
    !fs.existsSync(record.worktree) && Boolean(record.locked));
  const missing = records.filter((record) =>
    !fs.existsSync(record.worktree) && !record.locked);
  ok(`Worktree inventory: ${records.length} registered, ${initializing.length} initializing, ${missing.length} missing.`);
  if (records.length > 25) {
    warn(`${records.length} registered worktrees increase fetch/status overhead; cleanup requires a separate clean-and-merged review.`);
  }
  if (initializing.length) {
    warn(`${initializing.length} missing worktree path(s) are locked initializing and must not be pruned.`);
  }
  if (missing.length) {
    warn(`${missing.length} unlocked worktree path(s) are missing and may be prunable after branch review.`);
  }

  const divergence = gitText(['rev-list', '--left-right', '--count', 'HEAD...origin/main']);
  if (divergence) {
    const [ahead, behind] = divergence.split(/\s+/).map(Number);
    ok(`HEAD vs origin/main: ahead ${ahead}, behind ${behind}.`);
    if (releaseMode && (ahead !== 0 || behind !== 0)) {
      fail('Release mode requires HEAD to equal origin/main exactly.');
    }
  } else if (releaseMode) {
    fail('Release mode could not compare HEAD with origin/main; fetch origin first.');
  } else {
    warn('Could not compare HEAD with origin/main; fetch origin for divergence proof.');
  }

  if (releaseMode) {
    if (branch !== 'main') fail(`Release mode requires branch main; found ${branch}.`);
    if (dirtyCount !== 0) fail(`Release mode requires a clean checkout; found ${dirtyCount} tracked change(s).`);
  }
}

function verifyLiveClients() {
  const gh = run('gh', ['auth', 'status']);
  if (!gh.ok) fail('GitHub CLI authentication is unavailable.');
  else ok('GitHub CLI authentication is healthy.');

  const netlify = run('netlify', ['status', '--json'], { NETLIFY_SITE_ID: EXPECTED.siteId });
  if (!netlify.ok) {
    fail('Netlify CLI authentication or site linkage is unavailable.');
  } else {
    try {
      const payload = JSON.parse(netlify.stdout);
      const site = payload.siteData || {};
      if (site['site-id'] !== EXPECTED.siteId || site['site-name'] !== EXPECTED.siteName ||
          site['site-url'] !== EXPECTED.siteUrl) {
        fail('Netlify CLI is linked to the wrong project.');
      } else {
        ok('Netlify CLI is authenticated and linked to AfroTools.');
      }
    } catch (_error) {
      fail('Netlify CLI returned unreadable status JSON.');
    }
  }

  const claude = run('claude', ['mcp', 'list']);
  const claudeOutput = stripAnsi(`${claude.stdout}\n${claude.stderr}`);
  if (!claude.ok) {
    fail('Claude MCP health check failed. Restart Claude after environment/config changes.');
  } else if (!/supabase:.*Connected/i.test(claudeOutput) ||
             /supabase:.*(?:Needs authentication|Failed to connect)/i.test(claudeOutput)) {
    fail('Claude cannot authenticate the required AfroTools Supabase MCP server.');
  } else {
    ok('Claude can connect to the AfroTools Supabase MCP server.');
  }
}

verifyStaticContract();
inspectGitAndWorktrees();
if (liveMode) verifyLiveClients();

console.log('AfroTools deploy doctor');
for (const message of confirmations) console.log(`OK: ${message}`);
for (const message of warnings) console.log(`WARN: ${message}`);
for (const message of errors) console.log(`ERROR: ${message}`);
console.log(`Summary: ${confirmations.length} ok, ${warnings.length} warning(s), ${errors.length} error(s).`);

if (errors.length) process.exitCode = 1;
