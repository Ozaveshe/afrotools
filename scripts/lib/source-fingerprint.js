'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function repositoryPath(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || relative.includes('\\')) {
    throw new Error('Source fingerprints require repository-relative forward-slash paths.');
  }
  const resolved = path.resolve(root, relative);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error('Source path escapes repository.');
  return resolved;
}

function sourceFingerprint(root, files, contract) {
  const inputs = [...new Set(files)].sort().map((file) => {
    const absolute = repositoryPath(root, file);
    return { path: file, sha256: fs.existsSync(absolute) ? sha256(fs.readFileSync(absolute)) : null };
  });
  const missing = inputs.filter((entry) => !entry.sha256).map((entry) => entry.path);
  return {
    algorithm: 'sha256',
    value: missing.length ? null : sha256(canonicalJson({ contract, inputs })),
    files: inputs,
    missing
  };
}

module.exports = { canonicalJson, repositoryPath, sha256, sourceFingerprint };
