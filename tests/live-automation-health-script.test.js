const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const pkg = require('../package.json');
const auditScript = fs.readFileSync(path.join(ROOT, 'scripts', 'audit-live-automation-health.js'), 'utf8');

assert.strictEqual(
  pkg.scripts['automation:live-health'],
  'node scripts/audit-live-automation-health.js',
  'The default live-health command should generate the report without failing on stale/missing scheduled proof'
);

assert.strictEqual(
  pkg.scripts['automation:live-health:strict'],
  'node scripts/audit-live-automation-health.js --fail-on-stale',
  'The strict live-health gate must fail on stale, degraded, missing, or unavailable live proof'
);

assert.ok(
  pkg.scripts.test.includes('node tests/live-automation-health-script.test.js'),
  'npm test should protect the live-health command contract'
);

assert.ok(
  auditScript.includes("process.argv.includes('--fail-on-stale')"),
  'audit-live-automation-health.js must continue to expose the strict flag'
);

assert.match(
  auditScript,
  /FAIL_ON_STALE\s*&&\s*problems\.length[\s\S]*process\.exitCode\s*=\s*1/,
  'The strict flag should exit non-zero whenever live proof has problems'
);

assert.match(
  auditScript,
  /function writeTextFileWithRetry[\s\S]*isTransientFsError[\s\S]*sleepSync/,
  'live-health report writes should retry transient Windows file locks'
);

assert.ok(
  auditScript.includes("writeTextFileWithRetry(jsonPath") &&
    auditScript.includes("writeTextFileWithRetry(latestJsonPath") &&
    auditScript.includes("writeTextFileWithRetry(mdPath") &&
    auditScript.includes("writeTextFileWithRetry(latestMdPath"),
  'all live-health report outputs should use the retry-safe writer'
);

console.log('live-automation-health-script: ok');
