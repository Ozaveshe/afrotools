#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const { performance } = require('perf_hooks');
const path = require('path');

const STAGES = [
  'build:registry',
  'build:surfaces',
  'build:assets',
  'build:seo'
];

// Validation remains a separate, explicit release/CI gate via
// `npm run build:checks`. Running it again inside `npm run build` duplicates
// the most expensive whole-site scans after the same generators have already
// completed, which pushes Netlify source builds beyond the platform timeout.

function formatDuration(milliseconds) {
  const totalSeconds = Math.round(milliseconds / 100) / 10;
  return `${totalSeconds.toFixed(1)}s`;
}

function runStage(stage) {
  const startedAt = performance.now();
  console.log(`\n[build] START ${stage}`);

  const isWindows = process.platform === 'win32';
  const command = isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm';
  const args = isWindows ? ['/d', '/s', '/c', `npm run ${stage}`] : ['run', stage];
  const preload = path.join(__dirname, 'lib', 'build-safe-fs.js').replace(/\\/g, '/');
  const nodeOptions = [process.env.NODE_OPTIONS, `--require=${preload}`].filter(Boolean).join(' ');
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    stdio: 'inherit'
  });

  const elapsed = performance.now() - startedAt;
  if (result.error) {
    console.error(`[build] FAIL ${stage} (${formatDuration(elapsed)}): ${result.error.message}`);
    process.exitCode = 1;
    return false;
  }

  if (result.status !== 0) {
    console.error(`[build] FAIL ${stage} (${formatDuration(elapsed)}), exit ${result.status}`);
    process.exitCode = result.status || 1;
    return false;
  }

  console.log(`[build] PASS ${stage} (${formatDuration(elapsed)})`);
  return true;
}

const buildStartedAt = performance.now();
const timings = [];

for (const stage of STAGES) {
  const stageStartedAt = performance.now();
  if (!runStage(stage)) {
    console.error(`[build] STOPPED after ${stage}; later stages were not run.`);
    process.exit(process.exitCode || 1);
  }
  timings.push({ stage, elapsed: performance.now() - stageStartedAt });
}

console.log('\n[build] Stage timings');
for (const timing of timings) {
  console.log(`  ${timing.stage.padEnd(18)} ${formatDuration(timing.elapsed)}`);
}
console.log(`[build] COMPLETE (${formatDuration(performance.now() - buildStartedAt)})`);
