#!/usr/bin/env node
/**
 * Fail closed when a release checkout is linked to the wrong product channel.
 * This file and ops/deploy-channel.json contain identifiers only, never keys.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'ops', 'deploy-channel.json');
const NETLIFY_STATE_PATH = path.join(ROOT, '.netlify', 'state.json');
const allowDirty = process.argv.includes('--allow-dirty');
const releaseMode = process.argv.includes('--release');
const deployContext = String(process.env.CONTEXT || '').trim();
const isHostedNetlifyBuild = process.env.NETLIFY === 'true' || Boolean(process.env.SITE_ID && deployContext);
const isDeployPreview = deployContext === 'deploy-preview';
const isBranchDeploy = deployContext === 'branch-deploy';

const EXPECTED = Object.freeze({
  product: 'afrotools',
  siteId: '8aa543db-b4bd-4631-98f8-221440055c41',
  siteName: 'afrotools',
  primaryUrl: 'https://afrotools.com',
  supabaseProjectRef: 'zpclagtgczsygrgztlts',
  supabaseProjectUrl: 'https://zpclagtgczsygrgztlts.supabase.co',
  repository: 'https://github.com/Ozaveshe/afrotools'
});

function fail(message) {
  console.error(`Deploy channel verification failed: ${message}`);
  process.exit(1);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${label} is missing or invalid (${path.relative(ROOT, filePath)}): ${error.message}`);
  }
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.message).trim();
    fail(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}

function normalizeRepository(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/^git@github\.com:/i, 'https://github.com/')
    .replace(/^(https?:\/\/)[^/@]+@/i, '$1')
    .replace(/\.git$/i, '')
    .replace(/\/$/, '');

  try {
    const url = new URL(normalized);
    url.username = '';
    url.password = '';
    return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, '');
  } catch {
    return normalized;
  }
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    fail(`${label} must be ${expected}; received ${actual || '(empty)'}`);
  }
}

const manifest = readJson(MANIFEST_PATH, 'deploy channel manifest');
requireEqual(manifest.schemaVersion, 1, 'manifest schemaVersion');
requireEqual(manifest.product, EXPECTED.product, 'product');
requireEqual(manifest.netlify && manifest.netlify.siteId, EXPECTED.siteId, 'Netlify site ID');
requireEqual(manifest.netlify && manifest.netlify.siteName, EXPECTED.siteName, 'Netlify site name');
requireEqual(manifest.netlify && manifest.netlify.primaryUrl, EXPECTED.primaryUrl, 'Netlify primary URL');
requireEqual(
  manifest.supabase && manifest.supabase.projectRef,
  EXPECTED.supabaseProjectRef,
  'Supabase project ref'
);
requireEqual(
  manifest.supabase && manifest.supabase.projectUrl,
  EXPECTED.supabaseProjectUrl,
  'Supabase project URL'
);
requireEqual(
  normalizeRepository(manifest.git && manifest.git.repository),
  EXPECTED.repository,
  'Git repository'
);

if (isHostedNetlifyBuild) {
  requireEqual(process.env.SITE_ID || process.env.NETLIFY_SITE_ID, EXPECTED.siteId, 'hosted Netlify SITE_ID');
} else {
  const netlifyState = fs.existsSync(NETLIFY_STATE_PATH)
    ? readJson(NETLIFY_STATE_PATH, 'Netlify link')
    : null;
  const configuredSiteId = process.env.NETLIFY_SITE_ID || (netlifyState && netlifyState.siteId);
  if (configuredSiteId) {
    requireEqual(configuredSiteId, EXPECTED.siteId, 'local Netlify site ID');
  }
  if (netlifyState && process.env.NETLIFY_SITE_ID) {
    requireEqual(netlifyState.siteId, process.env.NETLIFY_SITE_ID, 'Netlify state/environment site ID');
  }
}

if (process.env.NETLIFY_SITE_ID && !isHostedNetlifyBuild) {
  requireEqual(process.env.NETLIFY_SITE_ID, EXPECTED.siteId, 'NETLIFY_SITE_ID');
}

for (const name of ['SUPABASE_URL', 'SUPABASE_AUTH_URL']) {
  if (process.env[name]) {
    requireEqual(
      String(process.env[name]).replace(/\/$/, ''),
      EXPECTED.supabaseProjectUrl,
      name
    );
  }
}

const repository = normalizeRepository(git(['remote', 'get-url', 'origin']));
requireEqual(repository, EXPECTED.repository, 'origin remote');

const hostedBranch = String(process.env.HEAD || process.env.BRANCH || '').trim();
const branch = isHostedNetlifyBuild ? hostedBranch : git(['branch', '--show-current']);
if (!branch) fail('release checkout is detached and no Netlify HEAD/BRANCH was provided');
const releaseBranches = manifest.git && manifest.git.releaseBranches;
if (!Array.isArray(releaseBranches)) fail('git.releaseBranches must be an array');
if (isDeployPreview) {
  const hasPreviewProof = process.env.PULL_REQUEST === 'true' && Boolean(process.env.REVIEW_ID);
  if (!hasPreviewProof) fail('deploy-preview requires PULL_REQUEST=true and REVIEW_ID');
} else if (isBranchDeploy) {
  if (!isHostedNetlifyBuild) fail('branch-deploy context is valid only inside Netlify');
} else if ((isHostedNetlifyBuild || releaseMode) && !releaseBranches.includes(branch)) {
  fail(`branch ${branch} is not listed in git.releaseBranches`);
}

const dirty = git(['status', '--porcelain', '--untracked-files=all']);
if (dirty && !allowDirty) {
  const paths = dirty.split(/\r?\n/).slice(0, 10).join(', ');
  fail(`working tree is not clean (${paths})`);
}

const commit = String(process.env.COMMIT_REF || '').trim() || git(['rev-parse', 'HEAD']);
console.log('AfroTools deploy channel verified.');
console.log(`Product: ${manifest.displayName}`);
console.log(`Netlify: ${EXPECTED.siteName} (${EXPECTED.siteId})`);
console.log(`Primary URL: ${EXPECTED.primaryUrl}`);
console.log(`Supabase ref: ${EXPECTED.supabaseProjectRef}`);
console.log(`Git: ${branch}@${commit}${deployContext ? ` (${deployContext})` : ''}`);
if (!isHostedNetlifyBuild && !process.env.NETLIFY_SITE_ID && !fs.existsSync(NETLIFY_STATE_PATH)) {
  console.log('Netlify link: manifest-only local verification (set NETLIFY_SITE_ID for CLI use)');
}
if (dirty && allowDirty) console.log('Working tree: dirty (--allow-dirty was supplied)');
