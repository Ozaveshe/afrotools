#!/usr/bin/env node
/**
 * Lightweight source secret scanner for AfroTools.
 *
 * This allows Supabase anon JWTs because they are public client credentials,
 * but fails on service-role JWTs, private keys, provider secrets, and
 * suspicious hard-coded assignments.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const SKIP_DIRS = new Set([
  '.git',
  '.agents',
  '.claude',
  '.codex',
  '.jamb',
  '.jamb-tools',
  '.playwright',
  '.playwright-cli',
  '.tmp-validation',
  'dist',
  'node_modules',
  'output',
  'reports',
  'test-results'
]);

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.env',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.sql',
  '.toml',
  '.ts',
  '.txt',
  '.xml',
  '.yaml',
  '.yml'
]);

const SECRET_PATTERNS = [
  { name: 'Private key block', re: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/g },
  { name: 'AWS access key', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9_]{36,}\b/g },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'Slack token', re: /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/g },
  { name: 'Stripe or Paystack secret key', re: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/g },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'OpenAI API key', re: /\b(?:sk-proj-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{32,})\b/g },
  { name: 'Netlify token', re: /\bnfp_[A-Za-z0-9_]{30,}\b/g }
];

const JWT_RE = /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g;
const ASSIGNMENT_RE =
  /\b(?:API_KEY|AUTH_SECRET|ADMIN_SECRET|PASSWORD|PRIVATE_KEY|SECRET|SERVICE_ROLE|SERVICE_KEY|TOKEN)\b\s*[:=]\s*['"]([A-Za-z0-9_./+=:-]{24,})['"]/gi;

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return path.basename(filePath).startsWith('.env');
}

function shouldSkipLine(line) {
  return /your-|placeholder|example|changeme|\.\.\.|\${{\s*secrets\.|process\.env/i.test(line);
}

function shouldSkipAssignment(filePath, line) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel === 'scripts/indexnow.js' && /indexnow|API_KEY/i.test(line)) return true;
  return false;
}

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function decodeJwtPayload(token) {
  try {
    return JSON.parse(decodeBase64Url(token.split('.')[1]));
  } catch (error) {
    return null;
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
    } else if (entry.isFile()) {
      const full = path.join(dir, entry.name);
      if (isTextFile(full)) files.push(full);
    }
  }
  return files;
}

function addFinding(findings, filePath, lineNumber, name, evidence) {
  findings.push({
    file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
    line: lineNumber,
    name,
    evidence: evidence.slice(0, 120)
  });
}

function scanFile(filePath, findings) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (shouldSkipLine(line)) return;

    for (const pattern of SECRET_PATTERNS) {
      pattern.re.lastIndex = 0;
      if (pattern.re.test(line)) addFinding(findings, filePath, lineNumber, pattern.name, line.trim());
    }

    JWT_RE.lastIndex = 0;
    let match;
    while ((match = JWT_RE.exec(line)) !== null) {
      const payload = decodeJwtPayload(match[0]);
      if (payload && payload.role === 'anon' && payload.iss === 'supabase') {
        const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
        if (rel.startsWith('netlify/functions/')) {
          addFinding(findings, filePath, lineNumber, 'Hard-coded Supabase anon key in server function', line.trim());
        }
        continue;
      }
      if (filePath.replace(/\\/g, '/').includes('/tools/jwt-decoder/')) continue;
      addFinding(findings, filePath, lineNumber, 'Hard-coded JWT', line.trim());
    }

    ASSIGNMENT_RE.lastIndex = 0;
    while ((match = ASSIGNMENT_RE.exec(line)) !== null) {
      if (shouldSkipAssignment(filePath, line)) continue;
      const value = match[1];
      if (/^(true|false|null|undefined)$/i.test(value)) continue;
      if (/^[A-Z0-9_]+$/.test(value)) continue;
      addFinding(findings, filePath, lineNumber, 'Suspicious secret assignment', line.trim());
    }
  });
}

function main() {
  const findings = [];
  for (const file of walk(ROOT)) scanFile(file, findings);

  if (findings.length) {
    console.error('Security scan failed: possible secrets found.');
    findings.slice(0, 60).forEach((finding) => {
      console.error(`  - ${finding.name}: ${finding.file}:${finding.line}`);
      console.error(`    ${finding.evidence}`);
    });
    if (findings.length > 60) console.error(`  ...and ${findings.length - 60} more`);
    process.exit(1);
  }

  console.log('Security scan passed.');
}

main();
