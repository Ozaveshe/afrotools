'use strict';

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const contract = require('./ci-artifact-contract');
const ROOT = path.resolve(__dirname, '..');
const INVENTORY = path.join(__dirname, 'ci-artifact-groups.json');

function expected(env = process.env) {
  return {commit: env.SEALED_COMMIT, tree: env.SEALED_TREE, runId: env.GITHUB_RUN_ID,
    attempt: env.GITHUB_RUN_ATTEMPT, deadline: env.SEALED_DEADLINE, manifestSha256: env.SEALED_MANIFEST_SHA256};
}

function binding(env = process.env) {
  return {commit: contract.git(ROOT, ['rev-parse', 'HEAD']), tree: contract.git(ROOT, ['rev-parse', 'HEAD^{tree}']),
    runId: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT, deadline: Number(env.SEALED_DEADLINE),
    eventSha: env.GITHUB_SHA, ref: env.GITHUB_REF, headRef: env.GITHUB_HEAD_REF || '', baseRef: env.GITHUB_BASE_REF || ''};
}

function runOriginal(step, root, deadline, logFile) {
  const remaining = contract.deadlineCheck(deadline);
  contract.check(Object.values(step.env || {}).every(value => typeof value === 'string'), 'Nonliteral gate environment');
  const originalEnv = Object.fromEntries(Object.entries(step.env || {}).map(([key, value]) => {
    if (value.includes('${{ runner.temp }}')) contract.check(Boolean(process.env.RUNNER_TEMP), 'Native runner.temp unavailable');
    const resolved = value.replaceAll('${{ runner.temp }}', process.env.RUNNER_TEMP || '');
    contract.check(!resolved.includes('${{'), 'Unsupported native context expression');
    return [key, resolved];
  }));
  const env = {...process.env, ...originalEnv};
  return new Promise((resolve, reject) => {
    // The original workflow leaves shell unspecified: GitHub uses bash -e {0}.
    const scriptFile = logFile + '.sh';
    fs.writeFileSync(scriptFile, step.run, {mode: 0o700});
    const child = cp.spawn('bash', ['-e', scriptFile],
      {cwd: root, env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe']});
    const log = fs.createWriteStream(logFile);
    const output = (data, stream) => { log.write(data); stream.write(data); };
    child.stdout.on('data', data => output(data, process.stdout));
    child.stderr.on('data', data => output(data, process.stderr));
    let timedOut = false;
    const kill = () => {
      timedOut = true;
      try { if (process.platform === 'win32') child.kill('SIGKILL'); else process.kill(-child.pid, 'SIGKILL'); } catch (_) {}
    };
    const timer = setTimeout(kill, remaining);
    child.on('error', error => { clearTimeout(timer); log.end(); reject(error); });
    child.on('close', (code, signal) => {
      clearTimeout(timer); log.end();
      resolve({exitCode: typeof code === 'number' ? code : 1, signal, timedOut});
    });
  });
}

function captureEvidence(root, output) {
  for (const relative of ['test-results', 'playwright-report']) {
    const from = path.join(root, relative);
    if (fs.existsSync(from)) fs.cpSync(from, path.join(output, relative), {recursive: true, dereference: false});
  }
}

function captureOwnerEvidence(step, output) {
  for (const [key, value] of Object.entries(step.env || {})) {
    if (!value.startsWith('${{ runner.temp }}/')) continue;
    const ownerPath = path.join(process.env.RUNNER_TEMP, value.slice('${{ runner.temp }}/'.length));
    contract.check(path.resolve(ownerPath).startsWith(path.resolve(process.env.RUNNER_TEMP) + path.sep), 'Owner evidence escapes native runner temp');
    if (fs.existsSync(ownerPath)) fs.cpSync(ownerPath, path.join(output, key), {recursive: true, dereference: false});
  }
}

async function runGroup(root, bundle, evidence, group, inventory, env = process.env) {
  contract.inventoryCheck(inventory);
  contract.check([1, 2].includes(group), 'Invalid browser group');
  fs.mkdirSync(evidence, {recursive: true});
  const report = {schema: 1, group, status: 'failed', integrity: 'not_run', setup: 'not_run', gates: []};
  try {
    const manifest = contract.restore(root, bundle, expected(env));
    for (const key of ['commit', 'tree', 'runId', 'attempt', 'deadline', 'inventorySha256', 'distTreeSha256', 'sourceTreeSha256', 'archiveSha256']) report[key] = manifest[key];
    contract.check(manifest.inventorySha256 === contract.jsonHash(inventory), 'Inventory differs from producer');
    // Consumer setup has the same complete commands and the same shared deadline; it cannot rebuild the artifact.
    for (const [index, step] of inventory.consumerSetup.entries()) {
      const result = await runOriginal(step, root, manifest.deadline, path.join(evidence, 'setup-' + index + '.log'));
      contract.check(result.exitCode === 0 && !result.timedOut, 'Browser setup failed/deadline expired');
    }
    report.setup = 'pass';
    contract.verify(root, bundle, expected(env));
    for (const gate of inventory.browser.filter(g => g.group === group)) {
      const folder = path.join(evidence, gate.id); fs.mkdirSync(folder, {recursive: true});
      console.log('\nExecuting original gate: ' + gate.step.name);
      const record = {id: gate.id, stepSha256: gate.stepSha256, status: 'failed', exitCode: null};
      report.gates.push(record);
      try {
        contract.deadlineCheck(manifest.deadline);
        contract.sourceClean(root);
        const result = await runOriginal(gate.step, root, manifest.deadline, path.join(folder, 'native-command.log'));
        Object.assign(record, result);
        contract.check(result.exitCode === 0 && !result.timedOut, 'Original gate failed/deadline expired: ' + gate.id);
        contract.deadlineCheck(manifest.deadline);
        contract.sourceClean(root);
        record.status = 'success';
      } finally {
        captureEvidence(root, folder);
        captureOwnerEvidence(gate.step, folder);
        fs.writeFileSync(path.join(folder, 'gate.json'), JSON.stringify(record, null, 2) + '\n');
      }
    }
    // Keep the original post-browser clean-generation invariant after moving its ownership check before seal.
    const parity = await runOriginal(inventory.generatedCheck, root, manifest.deadline, path.join(evidence, 'post-browser-generated-parity.log'));
    contract.check(parity.exitCode === 0 && !parity.timedOut, 'Post-browser generated parity failed');
    contract.verify(root, bundle, expected(env));
    report.integrity = 'pass'; report.status = 'success';
  } catch (error) {
    report.error = error.message;
  } finally {
    fs.writeFileSync(path.join(evidence, 'group-' + group + '.json'), JSON.stringify(report, null, 2) + '\n');
  }
  contract.check(report.status === 'success', report.error || 'Browser group failed');
  return report;
}

async function main() {
  const inventory = contract.readJson(INVENTORY), action = process.argv[2];
  if (action === 'seal') {
    const output = process.env.SEALED_BUNDLE;
    contract.check(Boolean(output), 'Seal output missing');
    const result = contract.seal(ROOT, output, binding(), inventory);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries({manifest_sha256: result.manifestSha256,
      commit: result.manifest.commit, tree: result.manifest.tree, deadline: result.manifest.deadline}).map(([key, value]) => key + '=' + value).join('\n') + '\n');
    console.log('One artifact sealed; dist content tree ' + result.manifest.distTreeSha256);
  } else if (action === 'group') {
    await runGroup(ROOT, process.env.SEALED_BUNDLE, process.env.GROUP_EVIDENCE, Number(process.env.BROWSER_GROUP), inventory);
  } else if (action === 'aggregate') {
    const manifest = contract.boundManifest(process.env.SEALED_BUNDLE, expected());
    contract.check(contract.git(ROOT, ['rev-parse', 'HEAD']) === manifest.commit && contract.git(ROOT, ['rev-parse', 'HEAD^{tree}']) === manifest.tree, 'Aggregate source identity mismatch');
    const reports = [1, 2].map(group => contract.readJson(path.join(process.env.GROUP_REPORTS, 'browser-evidence-' + process.env.GITHUB_RUN_ID + '-' + process.env.GITHUB_RUN_ATTEMPT + '-' + group, 'group-' + group + '.json')));
    contract.aggregate(inventory, manifest, reports, JSON.parse(process.env.NEEDS_JSON));
    console.log('Build and audit passed: every original gate, sealed artifact/source identity and shared deadline verified');
  } else throw new Error('Unknown CI artifact action');
}

module.exports = {expected, binding, runOriginal, captureEvidence, runGroup};
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
