'use strict';

// Test-only identity; this endpoint is never deployed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ENDPOINT = '/__afrotools-test/french-finance-identity';
const EXPORTER = 'assets/js/pages/french-finance-export-contract.js';
const { readCurrentFinanceScope } = require('./french-finance-current-scope');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function readFinanceProofIdentity(root, port) {
  const workspaceRoot = fs.realpathSync(root);
  const git = (...args) => execFileSync('git', args, {
    cwd: workspaceRoot, encoding: 'utf8', windowsHide: true
  }).trim();
  const commit = git('rev-parse', 'HEAD');
  const tree = git('rev-parse', 'HEAD^{tree}');
  const runId = process.env.FRENCH_FINANCE_EXPORT_RUN_ID;
  if (!runId || !/^[a-zA-Z0-9_.-]+$/.test(runId)) throw new Error('A safe, explicit French finance run ID is required.');
  if (commit !== process.env.FRENCH_FINANCE_EXPECTED_COMMIT || tree !== process.env.FRENCH_FINANCE_EXPECTED_TREE) {
    throw new Error('French finance candidate commit/tree differs from the explicitly requested identity.');
  }
  const dirty = git('status', '--porcelain=v1', '--untracked-files=all').split(/\r?\n/)
    .filter(Boolean).filter(line => !line.endsWith(' test-results/.last-run.json'));
  if (dirty.length) throw new Error('French finance proof requires a clean candidate: ' + dirty.join(', '));
  const artifact = process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1';
  const servedRoot = artifact ? path.join(workspaceRoot, 'dist') : workspaceRoot;
  let releaseMarkerSha256 = null;
  if (artifact) {
    const bytes = fs.readFileSync(path.join(servedRoot, 'status/release.json'));
    const marker = JSON.parse(bytes);
    if (marker.commit !== commit || marker.production !== false) throw new Error('French finance artifact marker is not the requested local candidate.');
    releaseMarkerSha256 = sha256(bytes);
  }
  return {
    schemaVersion: 2, lane: 'french-finance-tax-market-data', runId,
    workspaceRoot, servedRoot, port, commit, tree,
    artifact, exporterPath: '/' + EXPORTER,
    exporterSha256: sha256(fs.readFileSync(path.join(servedRoot, EXPORTER))),
    releaseMarkerSha256, coverageSha256: readCurrentFinanceScope(workspaceRoot).coverageSha256
  };
}

module.exports = { ENDPOINT, sha256, readFinanceProofIdentity };
