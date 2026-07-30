#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG = require('../data/localization/fr-document-pdf-parity.json');
const ALLOWLIST = require('../data/localization/fr-document-pdf-language-allowlist.json');
const REPORT_PATH = path.join(ROOT, 'reports', 'french-document-pdf-language-oracle.json');
const WRITE = process.argv.includes('--write');

const STRONG_PATTERNS = [
  /\b(?:download|upload|browse|choose|select|click|drop|drag|copy|share|print|save|reset|clear|remove|delete|close|cancel|next|back|submit|start|open)\b/i,
  /\b(?:how it works|frequently asked questions|no files? selected|no results|something went wrong|try again)\b/i,
  /\b(?:your files?|your document|your browser|review before|verify before|ready to|processed locally)\b/i,
  /\b(?:privacy and security|source files?|output file|page range|all pages|selected pages)\b/i
];

const ENGLISH_WORDS = new Set([
  'about', 'add', 'after', 'all', 'and', 'are', 'before', 'browse', 'browser',
  'can', 'cancel', 'choose', 'clear', 'click', 'close', 'copy',
  'delete', 'does', 'download', 'drag', 'drop', 'error', 'file', 'files',
  'for', 'from', 'help', 'how', 'in', 'into', 'is', 'next', 'of', 'on',
  'open', 'or', 'output', 'please', 'preview', 'print', 'privacy', 'ready',
  'remove', 'reset', 'result', 'results', 'review', 'save', 'select', 'share',
  'start', 'submit', 'that', 'the', 'this', 'to', 'tool', 'tools', 'try',
  'upload', 'verify', 'warning', 'what', 'when', 'where', 'which', 'will',
  'with', 'without', 'you', 'your'
]);

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function clean(value) {
  return decodeEntities(value)
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripAllowed(value, appId) {
  const terms = [
    ...ALLOWLIST.globalExactTerms,
    ...ALLOWLIST.reviewedEnglishPhrases,
    ...ALLOWLIST.fixtureMarkers,
    ...(ALLOWLIST.routeExactTerms[appId] || [])
  ].sort((a, b) => b.length - a.length);
  let output = ` ${value} `;
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    output = output.replace(new RegExp(`(^|[^A-Za-z0-9])${escaped}(?=[^A-Za-z0-9]|$)`, 'gi'), ' ');
  }
  return output.replace(/\s+/g, ' ').trim();
}

function signals(value, appId) {
  const text = stripAllowed(clean(value), appId);
  if (!text || !/[A-Za-z]/.test(text)) return null;
  const strong = STRONG_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);
  const tokens = (text.match(/[A-Za-z][A-Za-z'-]*/g) || []).map((token) => token.toLowerCase());
  const words = tokens.filter((token) => ENGLISH_WORDS.has(token));
  const unique = [...new Set(words)];
  const longEnglish = unique.filter((word) => word.length >= 4);
  const blocker = strong.length > 0
    || longEnglish.length >= 2
    || (unique.length >= 4 && unique.some((word) => ['the', 'your', 'you', 'with', 'from', 'this', 'that'].includes(word)));
  if (!blocker) return null;
  return { text, strong, words: unique };
}

function lineFor(html, offset) {
  return html.slice(0, offset).split(/\r?\n/).length;
}

function pushFinding(findings, html, offset, surface, value, app) {
  const found = signals(value, app.id);
  if (!found) return;
  findings.push({
    appId: app.id,
    route: app.frenchRoute,
    file: app.frenchFile,
    line: lineFor(html, offset),
    surface,
    snippet: found.text.slice(0, 260),
    signals: found.words,
    strongPatterns: found.strong
  });
}

function collectJsonStrings(value, pathParts = [], output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectJsonStrings(entry, [...pathParts, String(index)], output));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => collectJsonStrings(entry, [...pathParts, key], output));
  } else if (typeof value === 'string') {
    output.push({ path: pathParts.join('.'), value });
  }
  return output;
}

function auditHtml(app, relativeFile, route) {
  const file = path.join(ROOT, relativeFile);
  const html = fs.readFileSync(file, 'utf8');
  const scopedApp = { ...app, frenchFile: relativeFile, frenchRoute: route };
  const findings = [];

  const metadataPatterns = [
    ['title', /<title[^>]*>([\s\S]*?)<\/title>/gi, 1],
    ['meta.description', /<meta\s+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/gi, 1],
    ['meta.og:title', /<meta\s+property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/gi, 1],
    ['meta.og:description', /<meta\s+property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/gi, 1]
  ];
  for (const [surface, pattern, group] of metadataPatterns) {
    let match;
    while ((match = pattern.exec(html))) pushFinding(findings, html, match.index, surface, match[group], scopedApp);
  }

  const schemaPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let schemaMatch;
  while ((schemaMatch = schemaPattern.exec(html))) {
    try {
      const parsed = JSON.parse(schemaMatch[1]);
      for (const item of collectJsonStrings(parsed)) {
        if (/^(?:@context|url|item|image|logo|sameAs|contentUrl|embedUrl)$/i.test(item.path.split('.').pop())) continue;
        pushFinding(findings, html, schemaMatch.index, `jsonld.${item.path}`, item.value, scopedApp);
      }
    } catch {
      findings.push({
        appId: app.id,
        route,
        file: relativeFile,
        line: lineFor(html, schemaMatch.index),
        surface: 'jsonld',
        snippet: 'JSON-LD non analysable',
        signals: ['invalid-jsonld'],
        strongPatterns: []
      });
    }
  }

  const markupOnly = html.replace(/<(script|style|noscript|template|svg|code|pre)\b[\s\S]*?<\/\1>/gi, ' ');
  const bodyMatch = markupOnly.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyOffset = html.indexOf(bodyMatch[1]);
    const body = bodyMatch[1].replace(/<!--[\s\S]*?-->/g, ' ');
    const textPattern = />([^<]+)</g;
    let textMatch;
    while ((textMatch = textPattern.exec(body))) {
      pushFinding(findings, html, bodyOffset + textMatch.index, 'visible.text', textMatch[1], scopedApp);
    }
    const attributePattern = /\b(placeholder|title|aria-label|aria-description|alt)=("([^"]*)"|'([^']*)')/gi;
    let attributeMatch;
    while ((attributeMatch = attributePattern.exec(body))) {
      const value = attributeMatch[3] == null ? attributeMatch[4] : attributeMatch[3];
      pushFinding(findings, html, bodyOffset + attributeMatch.index, `visible.${attributeMatch[1].toLowerCase()}`, value, scopedApp);
    }
  }
  return findings;
}

function buildReport() {
  const rows = [];
  for (const app of CONFIG.apps) {
    const findings = auditHtml(app, app.frenchFile, app.frenchRoute);
    const workspaceFindings = app.frenchWorkspaceFile
      ? auditHtml(app, app.frenchWorkspaceFile, app.frenchWorkspaceRoute)
      : [];
    rows.push({
      id: app.id,
      route: app.frenchRoute,
      file: app.frenchFile,
      workspaceRoute: app.frenchWorkspaceRoute || null,
      status: findings.length || workspaceFindings.length ? 'blocked' : 'accepted',
      findings,
      workspaceFindings
    });
  }
  return {
    schemaVersion: 1,
    locale: 'fr',
    category: 'document-pdf',
    denominator: 32,
    allowlist: path.relative(ROOT, path.join(ROOT, 'data', 'localization', 'fr-document-pdf-language-allowlist.json')).replace(/\\/g, '/'),
    summary: {
      accepted: rows.filter((row) => row.status === 'accepted').length,
      blocked: rows.filter((row) => row.status === 'blocked').length,
      findings: rows.reduce((sum, row) => sum + row.findings.length + row.workspaceFindings.length, 0)
    },
    rows
  };
}

function main() {
  const report = buildReport();
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (WRITE) fs.writeFileSync(REPORT_PATH, serialized, 'utf8');
  console.log(`French Document/PDF static language oracle: ${report.summary.accepted}/32 accepted, ${report.summary.findings} blocker(s).`);
  if (report.summary.blocked) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { signals, stripAllowed, buildReport };
