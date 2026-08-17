#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FR_ROOT = path.join(ROOT, 'fr');
const MAX_CONTEXT = 74;

function walk(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(absolute);
  }
  return output;
}

function decodeEntities(value) {
  const named = {
    amp: '&', apos: "'", gt: '>', hellip: '…', laquo: '«', lt: '<', nbsp: ' ',
    ndash: '–', quot: '"', raquo: '»', rsquo: '’'
  };
  return String(value || '')
    .replace(/&#(\d+);/g, (_, digits) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function visibleText(html) {
  return decodeEntities(String(html || '')
    .replace(/<(script|style|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function context(text, index) {
  return text.slice(Math.max(0, index - MAX_CONTEXT), index + MAX_CONTEXT).trim();
}

function findingsFor(text) {
  const findings = [];
  const patterns = [
    { id: 'replacement-character', re: /�/g },
    { id: 'utf8-as-latin1', re: /Ã./g },
    { id: 'broken-proof-label', re: /\b(?:Source|Point)\s+\?\s+(?:vérifier|confirmer)\b/gi }
  ];

  // A bare letter-question-letter regex also matches query strings and code
  // examples. Treat the complete whitespace-delimited token as a word so the
  // audit catches `fran?ais` while allowing `/api/rates?metric=price`.
  for (const match of text.matchAll(/\S*\?\S*/g)) {
    const token = match[0].replace(/^[^\p{L}?]+|[^\p{L}?]+$/gu, '');
    if (/^\p{L}[\p{L}'’-]*\?\p{L}[\p{L}'’?-]*$/u.test(token)) {
      findings.push({
        id: 'letter-question-letter',
        value: token,
        context: context(text, match.index)
      });
    }
  }
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.re)) {
      findings.push({ id: pattern.id, value: match[0], context: context(text, match.index) });
    }
  }
  return findings;
}

function audit() {
  const files = walk(FR_ROOT);
  const findings = [];
  let indexableFiles = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) continue;
    indexableFiles += 1;
    const text = visibleText(html);
    for (const finding of findingsFor(text)) {
      findings.push({ file: path.relative(ROOT, file).replaceAll('\\', '/'), ...finding });
    }
  }
  return { files: files.length, indexableFiles, findings };
}

if (require.main === module) {
  const result = audit();
  if (result.findings.length) {
    console.error(`French visible-mojibake audit failed: ${result.findings.length} finding(s) across ${result.indexableFiles} indexable pages.`);
    for (const finding of result.findings.slice(0, 100)) {
      console.error(`${finding.file} [${finding.id}] ${JSON.stringify(finding.value)} :: ${finding.context}`);
    }
    if (result.findings.length > 100) console.error(`... ${result.findings.length - 100} additional finding(s) omitted.`);
    process.exitCode = 1;
  } else {
    console.log(`French visible-mojibake audit passed: ${result.indexableFiles} indexable pages (${result.files} HTML files scanned).`);
  }
}

module.exports = { audit, findingsFor, visibleText };
