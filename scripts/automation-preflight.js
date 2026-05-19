#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const MIN_NODE_MAJOR = 18;
const SHOULD_LAUNCH_BROWSER = process.argv.indexOf('--no-browser-launch') === -1;
const REQUIRE_LIVE_ENV = /^(1|true|yes)$/i.test(process.env.AFROTOOLS_PREFLIGHT_REQUIRE_LIVE_ENV || '');

const checks = [];

function addCheck(level, label, detail, nextStep) {
  checks.push({
    level,
    label,
    detail: detail || '',
    nextStep: nextStep || ''
  });
}

function pass(label, detail) {
  addCheck('pass', label, detail);
}

function warn(label, detail, nextStep) {
  addCheck('warn', label, detail, nextStep);
}

function fail(label, detail, nextStep) {
  addCheck('fail', label, detail, nextStep);
}

function runCommand(name, args) {
  const commandArgs = args || [];
  if (process.platform === 'win32') {
    return spawnSync([name].concat(commandArgs).join(' '), {
      cwd: ROOT,
      encoding: 'utf8',
      shell: true,
      timeout: 30000
    });
  }

  return spawnSync(name, commandArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    timeout: 30000
  });
}

function cleanOutput(value) {
  return String(value || '').trim().split(/\r?\n/)[0] || '';
}

function candidateModulePaths() {
  const paths = [
    path.join(ROOT, 'node_modules'),
    process.env.AFROTOOLS_NODE_MODULE_DIR,
    path.join(os.homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules')
  ];
  return paths.filter(function (candidate) {
    return candidate && fs.existsSync(candidate);
  });
}

function resolveModule(moduleName) {
  const attempted = [];

  try {
    const resolved = require.resolve(moduleName);
    return { resolved, attempted };
  } catch (error) {
    attempted.push('default resolution: ' + error.message);
  }

  for (const modulePath of candidateModulePaths()) {
    try {
      const resolved = require.resolve(moduleName, { paths: [modulePath] });
      return { resolved, attempted };
    } catch (error) {
      attempted.push(modulePath + ': ' + error.message);
    }
  }

  return { resolved: '', attempted };
}

function hasEnv(names) {
  return names.some(function (name) {
    return !!String(process.env[name] || '').trim();
  });
}

function checkNodeVersion() {
  const version = process.versions.node;
  const major = Number(version.split('.')[0]);
  if (major >= MIN_NODE_MAJOR) {
    pass('Node.js version', 'v' + version);
  } else {
    fail('Node.js version', 'v' + version + ' is below required v' + MIN_NODE_MAJOR, 'Install Node.js ' + MIN_NODE_MAJOR + ' or newer.');
  }
}

function checkNpm() {
  const result = runCommand('npm', ['--version']);
  if (result.status === 0) {
    pass('npm availability', cleanOutput(result.stdout));
  } else {
    fail('npm availability', cleanOutput(result.stderr) || (result.error && result.error.message) || 'npm command failed', 'Install npm or run from the bundled Node.js runtime.');
  }
}

function checkPackageInstall() {
  const packageJsonPath = path.join(ROOT, 'package.json');
  const packageLockPath = path.join(ROOT, 'package-lock.json');
  const nodeModulesPath = path.join(ROOT, 'node_modules');

  if (fs.existsSync(packageJsonPath)) {
    pass('package.json', 'found');
  } else {
    fail('package.json', 'missing', 'Run this preflight from the AfroTools repo root.');
  }

  if (fs.existsSync(packageLockPath)) {
    pass('package-lock.json', 'found');
  } else {
    warn('package-lock.json', 'missing', 'Use npm install with the repo lockfile when available.');
  }

  if (fs.existsSync(nodeModulesPath)) {
    pass('node_modules', 'found');
  } else {
    fail('node_modules', 'missing', 'Run npm install before browser-dependent automation.');
  }

  const npmLs = runCommand('npm', ['ls', '--depth=0', '--json']);
  if (npmLs.status === 0) {
    pass('npm install state', 'top-level dependency tree resolves');
  } else {
    warn('npm install state', 'npm ls reported issues', 'Run npm install if module resolution fails.');
  }
}

function checkPlaywrightPackage() {
  const resolved = resolveModule('@playwright/test');
  if (resolved.resolved) {
    pass('Playwright package', '@playwright/test resolves at ' + resolved.resolved);
    return true;
  }

  fail(
    'Playwright package',
    '@playwright/test is not resolvable',
    'Run npm install, or set AFROTOOLS_NODE_MODULE_DIR to a Node module directory that contains @playwright/test.'
  );
  return false;
}

async function checkChromiumBrowser() {
  let playwright;
  try {
    playwright = require('@playwright/test');
  } catch (error) {
    fail('Chromium browser', 'cannot load @playwright/test: ' + error.message, 'Run npm install.');
    return;
  }

  const executablePath = playwright.chromium && playwright.chromium.executablePath
    ? playwright.chromium.executablePath()
    : '';

  if (!executablePath) {
    fail('Chromium browser', 'Playwright did not report a Chromium executable path', 'Run npx playwright install chromium.');
    return;
  }

  if (!fs.existsSync(executablePath)) {
    fail('Chromium browser', 'missing at expected Playwright path', 'Run npx playwright install chromium.');
    return;
  }

  pass('Chromium executable', 'found at Playwright-managed path');

  if (!SHOULD_LAUNCH_BROWSER) {
    warn('Chromium launch', 'skipped by --no-browser-launch', 'Run without --no-browser-launch before claiming browser coverage.');
    return;
  }

  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    pass('Chromium launch', 'headless launch succeeded');
  } catch (error) {
    fail('Chromium launch', error.message, 'Run npx playwright install chromium. If it still fails, mark browser coverage blocked.');
  } finally {
    if (browser) await browser.close().catch(function () {});
  }
}

function checkEnv() {
  const groups = [
    {
      label: 'Supabase auth service access',
      names: ['SUPABASE_AUTH_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY'],
      purpose: 'live auth-side scholarship/API checks'
    },
    {
      label: 'Supabase data read access',
      names: ['SUPABASE_DATA_ANON_KEY', 'SUPABASE_ANON_KEY_DATA', 'SUPABASE_ANON_KEY', 'SUPABASE_DATA_SERVICE_ROLE_KEY'],
      purpose: 'live data-source reads'
    },
    {
      label: 'Netlify blob/site access',
      names: ['NETLIFY_SITE_ID', 'NETLIFY_AUTH_TOKEN', 'NETLIFY_BLOBS_CONTEXT'],
      purpose: 'blob-backed freshness checks'
    },
    {
      label: 'Admin-only API access',
      names: ['ADMIN_KEY', 'ADMIN_SECRET'],
      purpose: 'admin freshness details'
    },
    {
      label: 'Email provider',
      names: ['RESEND_API_KEY'],
      purpose: 'notification-send smoke checks'
    }
  ];

  groups.forEach(function (group) {
    const present = hasEnv(group.names);
    const detail = group.purpose + ' (' + group.names.join(' or ') + ')';
    if (present) {
      pass(group.label, 'present for ' + group.purpose + '; value not printed');
    } else if (REQUIRE_LIVE_ENV) {
      fail(group.label, 'missing for ' + detail, 'Set the required environment variable group or disable live-env preflight strictness.');
    } else {
      warn(group.label, 'not set for ' + detail, 'Local browser smoke can still run, but do not claim live/API coverage that needs this secret.');
    }
  });
}

function printReport() {
  const order = { fail: 0, warn: 1, pass: 2 };
  const sorted = checks.slice().sort(function (left, right) {
    return order[left.level] - order[right.level] || left.label.localeCompare(right.label);
  });
  const counts = checks.reduce(function (acc, check) {
    acc[check.level] += 1;
    return acc;
  }, { pass: 0, warn: 0, fail: 0 });

  console.log('AfroTools automation preflight');
  console.log('- Node: ' + process.version);
  console.log('- Platform: ' + process.platform + ' ' + process.arch);
  console.log('- Root: ' + ROOT);
  console.log('');

  sorted.forEach(function (check) {
    const prefix = check.level === 'pass' ? 'PASS' : (check.level === 'warn' ? 'WARN' : 'FAIL');
    console.log(prefix + ' ' + check.label + (check.detail ? ': ' + check.detail : ''));
    if (check.nextStep) console.log('     Next: ' + check.nextStep);
  });

  console.log('');
  console.log('Summary: ' + counts.pass + ' passed, ' + counts.warn + ' warnings, ' + counts.fail + ' failures.');
  if (counts.fail > 0) {
    console.log('Browser-dependent tasks are BLOCKED until failures are fixed.');
  } else {
    console.log('Browser-dependent tasks may run. Treat warnings as scope limits.');
  }
}

async function main() {
  checkNodeVersion();
  checkNpm();
  checkPackageInstall();
  const hasPlaywright = checkPlaywrightPackage();
  if (hasPlaywright) await checkChromiumBrowser();
  checkEnv();
  printReport();

  if (checks.some(function (check) { return check.level === 'fail'; })) {
    process.exitCode = 1;
  }
}

main().catch(function (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
