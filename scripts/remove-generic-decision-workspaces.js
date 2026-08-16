#!/usr/bin/env node
'use strict';

/**
 * Remove the score-oriented `df-upgrade` rail from pages that already own a
 * real workflow. Pages where the rail is the only interaction are deliberately
 * left in place and reported as rebuild work; deleting their only controls
 * would make the product less useful.
 *
 * Usage:
 *   node scripts/remove-generic-decision-workspaces.js
 *   node scripts/remove-generic-decision-workspaces.js --check
 */

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry, renameSyncWithRetry } = require('./lib/safe-write');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const SCAN_ROOTS = ['agriculture', 'engineering', 'telecom', 'tools', 'fr']
  .map((entry) => path.join(ROOT, entry));
const SKIP_DIRS = new Set(['.git', 'dist', 'node_modules', 'reports', 'test-results']);

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else if (entry.name === 'index.html') output.push(file);
  }
  return output;
}

function sectionWithClass(html, className) {
  const pattern = new RegExp(
    `<section\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>[\\s\\S]*?<\\/section>`,
    'i'
  );
  const match = html.match(pattern);
  return match ? match[0] : '';
}

function isGenericDecisionWorkspace(rail, faq) {
  const text = `${rail}\n${faq}`;
  return /It is as accurate as the values you enter|completely free, works on any phone|Not sure how to get the most from the .*?Enter .*? and it returns|takes .*? and shows the working, not just a single number/i.test(text);
}

function removeGenericBlocks(html, rail, faq) {
  let output = html.replace(rail, '\n');
  if (faq && /It is as accurate as the values you enter|completely free, works on any phone/i.test(faq)) {
    output = output.replace(faq, '\n');
  }
  return output;
}

function isGeneratedFaq(entry) {
  const text = JSON.stringify(entry || {});
  return /planning summary|educational planning workflow|What should I verify before acting|Quality checks addressed here|It is as accurate as the values you enter|completely free, works on any phone|^.*How do I use the .*?fields above/is.test(text);
}

function cleanGeneratedFaqSchema(html) {
  return html.replace(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (block, source) => {
      let schema;
      try {
        schema = JSON.parse(source.trim());
      } catch (_) {
        return block;
      }
      if (!schema || schema['@type'] !== 'FAQPage' || !Array.isArray(schema.mainEntity)) return block;
      const retained = schema.mainEntity.filter((entry) => !isGeneratedFaq(entry));
      if (retained.length === schema.mainEntity.length) return block;
      if (!retained.length) return '';
      schema.mainEntity = retained;
      return `<script type="application/ld+json">\n${JSON.stringify(schema)}\n</script>`;
    }
  );
}

function stripSharedAssets(html) {
  if (/data-df-upgrade=|data-df-form=|class=["']df-faq["']/.test(html)) return html;
  return html
    .replace(/\s*<link\b[^>]*href=["']\/assets\/css\/english-df-app-upgrades\.css[^"']*["'][^>]*>\s*/gi, '\n')
    .replace(/\s*<script\b[^>]*src=["']\/assets\/js\/pages\/english-df-app-upgrades\.js[^"']*["'][^>]*><\/script>\s*/gi, '\n');
}

function interactionEvidence(html) {
  return {
    inputs: (html.match(/<(?:input|select|textarea)\b/gi) || []).length,
    buttons: (html.match(/<button\b/gi) || []).length,
    forms: (html.match(/<form\b/gi) || []).length,
    runtimeMounts: (html.match(/<(?:div|section)\b[^>]*(?:id=["'][^"']*(?:app|root|calculator)[^"']*["']|data-(?:tool|calculator)-root)[^>]*>/gi) || []).length,
  };
}

const contaminated = Array.from(new Set(SCAN_ROOTS.flatMap((directory) => walk(directory))))
  .filter((file) => fs.readFileSync(file, 'utf8').includes('data-df-upgrade='));

const removable = [];
const rebuild = [];
const retainedSpecific = [];

for (const file of contaminated) {
  const before = fs.readFileSync(file, 'utf8');
  const rail = sectionWithClass(before, 'df-upgrade');
  const faq = sectionWithClass(before, 'df-faq');
  const id = (before.match(/data-df-upgrade=["']([^"']+)/i) || [])[1] || '';
  if (!rail) {
    rebuild.push({ id, file: path.relative(ROOT, file).replace(/\\/g, '/'), reason: 'unrecognized-rail-shape' });
    continue;
  }
  if (!isGenericDecisionWorkspace(rail, faq)) {
    retainedSpecific.push({ id, file: path.relative(ROOT, file).replace(/\\/g, '/') });
    continue;
  }

  const withoutRail = removeGenericBlocks(before, rail, faq);
  const evidence = interactionEvidence(withoutRail);
  const appPath = path.join(path.dirname(file), 'app.html');
  const hasApp = fs.existsSync(appPath);
  if (!hasApp && evidence.inputs === 0 && evidence.buttons === 0 && evidence.forms === 0 && evidence.runtimeMounts === 0) {
    rebuild.push({
      id,
      file: path.relative(ROOT, file).replace(/\\/g, '/'),
      reason: 'generic-rail-is-only-interaction',
    });
    continue;
  }

  let after = cleanGeneratedFaqSchema(withoutRail);
  after = stripSharedAssets(after).replace(/\n{3,}/g, '\n\n');
  removable.push({
    id,
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    hasApp,
    evidence,
  });

  if (!CHECK && after !== before) {
    const temporary = `${file}.tmp-generic-workspace`;
    writeFileSyncWithRetry(temporary, after, 'utf8');
    renameSyncWithRetry(temporary, file);
  }
}

console.log(`Generic decision-workspace inventory: ${contaminated.length}`);
console.log(`Retained workflow-specific workspaces: ${retainedSpecific.length}`);
console.log(`${CHECK ? 'Removable duplicates' : 'Removed duplicates'}: ${removable.length}`);
console.log(`Generic rebuild queue (only interaction): ${rebuild.length}`);
for (const item of rebuild) console.log(`- ${item.id || '(unknown)'} :: ${item.file || item.reason}`);

if (CHECK && removable.length) {
  console.error(`${removable.length} pages still contain a removable generic decision workspace.`);
  process.exitCode = 1;
}
